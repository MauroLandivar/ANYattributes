import { NextRequest } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

const execFileAsync = promisify(execFile);

const TMP_DIR = "/tmp/anyattributes";
const PYTHON_PATH = process.env.PYTHON_PATH || "python3";
const PYTHON_SCRIPT = path.join(process.cwd(), "python", "excel_processor.py");

function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "placeholder",
  });
}

interface CellInfo {
  row: number;
  col: number;
  col_letter: string;
  product_id: string;
  product_name: string;
  category: string;
  skus: string;
  attribute_name: string;
  marketplace: string;
  data_type: string;
  dropdown_label: string;
  options: string[];
  color: "red" | "blue" | "none";
}

interface ProcessRequest {
  sessionId: string;
  cells: CellInfo[];
  originalFilename: string;
}

type SSEData =
  | {
      type: "progress";
      processed: number;
      total: number;
      product_name: string;
      attributes_filled: number;
      attributes_error: number;
      status: "ok" | "error";
    }
  | { type: "done"; sessionId: string; processedCount: number; errorCount: number }
  | { type: "error"; message: string };

async function getProductValues(cells: CellInfo[]): Promise<Record<string, string>> {
  const product = cells[0];

  const attributeLines = cells
    .map((cell) => {
      const typeLower = (cell.data_type || "").toLowerCase();
      const isListado =
        typeLower.includes("listado") ||
        typeLower.includes("list") ||
        typeLower.includes("sí/no") ||
        typeLower.includes("si/no") ||
        typeLower.includes("boolean");
      const isNumeroUnidad = typeLower.includes("unidad");
      const isNumero =
        (typeLower.includes("numero") || typeLower.includes("number")) &&
        !isNumeroUnidad;

      let line = `- ${cell.attribute_name}`;
      if (isListado && cell.options.length > 0) {
        const opts = cell.options.length > 30 ? [...cell.options.slice(0, 30), "..."] : cell.options;
        line += ` [Listado - elegí UNA opción de: ${opts.join(", ")}]`;
      } else if (isNumero) {
        line += ` [Número - solo el número, sin unidades]`;
      } else if (isNumeroUnidad) {
        line += ` [Número con unidad - ejemplo: '10 cm', '500 g']`;
      } else {
        line += ` [Texto libre - máx. 100 caracteres]`;
      }
      return line;
    })
    .join("\n");

  const userPrompt = `Producto: ${product.product_name || "desconocido"}
Categoría: ${product.category || "desconocida"}
Marketplace: ${product.marketplace || "desconocido"}

Completá estos atributos vacíos:
${attributeLines}

Respondé SOLO con un objeto JSON válido. Las claves deben ser los nombres de atributo exactos.
Ejemplo: {"Marca": "Samsung", "Voltaje": "220"}`;

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    system: `Sos un experto en catálogos de productos para marketplaces latinoamericanos.
Completá atributos de productos basándote en su nombre y categoría.
Respondé ÚNICAMENTE con JSON válido, sin markdown ni texto adicional.`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";

  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as Record<string, string>;
    }
  } catch {
    // JSON parse failed
  }
  return {};
}

function validateValue(cell: CellInfo, rawValue: string): string {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  const typeLower = (cell.data_type || "").toLowerCase();
  const isListado =
    typeLower.includes("listado") ||
    typeLower.includes("list") ||
    typeLower.includes("sí/no") ||
    typeLower.includes("si/no") ||
    typeLower.includes("boolean");

  if (isListado && cell.options.length > 0) {
    const exact = cell.options.find((o) => o.toLowerCase() === value.toLowerCase());
    if (exact) return exact;
    const partial = cell.options.find(
      (o) =>
        o.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(o.toLowerCase())
    );
    if (partial) return partial;
    return cell.options[0];
  }

  return value;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();

  const send = async (data: SSEData) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // Client disconnected
    }
  };

  (async () => {
    try {
      const body: ProcessRequest = await req.json();
      const { sessionId, cells } = body;

      if (!sessionId || !cells?.length) {
        await send({ type: "error", message: "Datos inválidos en la solicitud." });
        await writer.close();
        return;
      }

      const sessionDir = path.join(TMP_DIR, sessionId);
      const sourcePath = path.join(sessionDir, "original.xlsx");

      try {
        await fs.access(sourcePath);
      } catch {
        await send({
          type: "error",
          message: "Sesión no encontrada. Por favor sube el archivo nuevamente.",
        });
        await writer.close();
        return;
      }

      // Group cells by product row + marketplace — 1 API call per product per marketplace
      const productMap = new Map<string, CellInfo[]>();
      for (const cell of cells) {
        const key = `${cell.row}__${cell.marketplace}`;
        const list = productMap.get(key) ?? [];
        list.push(cell);
        productMap.set(key, list);
      }

      const products = [...productMap.entries()];
      const totalProducts = products.length;
      let processedProducts = 0;
      let totalCellsFilled = 0;
      let totalCellsError = 0;
      const filledCells: Array<CellInfo & { value: string }> = [];

      // Process 3 products concurrently
      const BATCH_SIZE = 3;
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async ([, productCells]) => {
            const product = productCells[0];
            let attributesFilled = 0;
            let attributesError = 0;

            try {
              const values = await getProductValues(productCells);

              for (const cell of productCells) {
                const rawValue = values[cell.attribute_name];
                if (rawValue !== undefined && String(rawValue).trim() !== "") {
                  const value = validateValue(cell, String(rawValue));
                  if (value) {
                    filledCells.push({ ...cell, value });
                    attributesFilled++;
                    totalCellsFilled++;
                  } else {
                    attributesError++;
                    totalCellsError++;
                  }
                } else {
                  attributesError++;
                  totalCellsError++;
                }
              }
            } catch (err) {
              console.error(
                `[process] Claude error for product ${product.product_name}:`,
                err
              );
              attributesError = productCells.length;
              totalCellsError += productCells.length;
            }

            processedProducts++;

            await send({
              type: "progress",
              processed: processedProducts,
              total: totalProducts,
              product_name: product.product_name,
              attributes_filled: attributesFilled,
              attributes_error: attributesError,
              status: attributesFilled > 0 ? "ok" : "error",
            });
          })
        );
      }

      // Write filled values to Excel via Python
      const cellsJsonPath = path.join(sessionDir, "cells_filled.json");
      await fs.writeFile(cellsJsonPath, JSON.stringify(filledCells), "utf-8");

      const outputPath = path.join(sessionDir, "output.xlsx");

      const { stdout, stderr } = await execFileAsync(
        PYTHON_PATH,
        [PYTHON_SCRIPT, "write", sourcePath, cellsJsonPath, outputPath],
        {
          maxBuffer: 50 * 1024 * 1024,
          timeout: 60_000,
        }
      );

      if (stderr) {
        console.warn("[process] Python write stderr:", stderr);
      }

      const writeResult = JSON.parse(stdout);
      if (writeResult.error) {
        await send({
          type: "error",
          message: `Error al escribir el archivo: ${writeResult.error}`,
        });
        await writer.close();
        return;
      }

      await send({
        type: "done",
        sessionId,
        processedCount: totalCellsFilled,
        errorCount: totalCellsError,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[process] Fatal error:", message);
      await send({ type: "error", message: `Error interno: ${message}` });
    } finally {
      try {
        await writer.close();
      } catch {
        // already closed
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
