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
  color: "red" | "blue";
}

interface ProcessRequest {
  sessionId: string;
  cells: CellInfo[];
  originalFilename: string;
}

type SSEData =
  | { type: "progress"; processed: number; total: number; cell: { row: number; col: number }; value: string; product_name: string; attribute_name: string; color: "red" | "blue"; marketplace: string; status: "ok" | "error" }
  | { type: "done"; sessionId: string; processedCount: number; errorCount: number }
  | { type: "error"; message: string };

async function getAIValue(cell: CellInfo): Promise<string> {
  const dataTypeLower = (cell.data_type || "").toLowerCase();
  const isListado = dataTypeLower.includes("listado") || dataTypeLower.includes("list");
  const isNumero = dataTypeLower.includes("numero") || dataTypeLower.includes("number");

  const systemPrompt = `Eres un experto en catálogos de productos para marketplaces.
Tu tarea es completar atributos faltantes de productos basándote en el nombre del producto y su categoría.
Responde ÚNICAMENTE con el valor solicitado, sin explicaciones ni texto adicional.`;

  let userPrompt = `Producto: ${cell.product_name || "desconocido"}
Categoría: ${cell.category || "desconocida"}
Marketplace: ${cell.marketplace || "desconocido"}
Atributo a completar: ${cell.attribute_name || "desconocido"}
Tipo de dato: ${cell.data_type || "Texto"}`;

  if (isListado && cell.options.length > 0) {
    userPrompt += `\nOpciones disponibles: ${cell.options.join(", ")}
IMPORTANTE: Debes elegir EXACTAMENTE una de las opciones disponibles, sin modificarla.`;
  } else if (isListado && cell.dropdown_label) {
    userPrompt += `\nLabel del campo: ${cell.dropdown_label}`;
  }

  if (isNumero) {
    userPrompt += `\nRespuesta: solo el número (sin unidades, sin texto). Ejemplo: 42`;
  } else if (isListado && cell.options.length > 0) {
    userPrompt += `\nRespuesta: elige exactamente una opción de la lista.`;
  } else {
    userPrompt += `\nRespuesta: valor corto y apropiado (máx. 100 caracteres).`;
  }

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 100,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const value =
    response.content[0]?.type === "text"
      ? response.content[0].text.trim()
      : "";

  // Validate listado response against available options
  if (isListado && cell.options.length > 0) {
    const exact = cell.options.find(
      (o) => o.toLowerCase() === value.toLowerCase()
    );
    if (exact) return exact;

    const partial = cell.options.find(
      (o) =>
        o.toLowerCase().includes(value.toLowerCase()) ||
        value.toLowerCase().includes(o.toLowerCase())
    );
    if (partial) return partial;

    // Fallback to first option
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

  // Process in background, return stream immediately
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
        await send({ type: "error", message: "Sesión no encontrada. Por favor sube el archivo nuevamente." });
        await writer.close();
        return;
      }

      const total = cells.length;
      let processedCount = 0;
      let errorCount = 0;
      const filledCells: Array<CellInfo & { value: string }> = [];

      // Process cells with controlled concurrency (5 parallel)
      const BATCH_SIZE = 5;
      for (let i = 0; i < cells.length; i += BATCH_SIZE) {
        const batch = cells.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (cell) => {
            let value = "";
            let status: "ok" | "error" = "ok";

            try {
              value = await getAIValue(cell);
              if (value) {
                filledCells.push({ ...cell, value });
              }
            } catch (err) {
              console.error(`[process] Claude error for cell (${cell.row},${cell.col}):`, err);
              status = "error";
              errorCount++;
            }

            processedCount++;

            await send({
              type: "progress",
              processed: processedCount,
              total,
              cell: { row: cell.row, col: cell.col },
              value,
              product_name: cell.product_name,
              attribute_name: cell.attribute_name,
              color: cell.color,
              marketplace: cell.marketplace,
              status,
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
        await send({ type: "error", message: `Error al escribir el archivo: ${writeResult.error}` });
        await writer.close();
        return;
      }

      await send({
        type: "done",
        sessionId,
        processedCount: processedCount - errorCount,
        errorCount,
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
