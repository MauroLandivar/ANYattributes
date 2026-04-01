import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

const TMP_DIR = "/tmp/anyattributes";
const PYTHON_PATH = process.env.PYTHON_PATH || "python3";
const PYTHON_SCRIPT = path.join(process.cwd(), "python", "excel_processor.py");

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    // Validate extension
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: "El archivo debe ser .xlsx o .xls" },
        { status: 400 }
      );
    }

    // Create session directory
    const sessionId = randomUUID();
    const sessionDir = path.join(TMP_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    // Save uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedPath = path.join(sessionDir, "original.xlsx");
    await fs.writeFile(uploadedPath, buffer);

    // Run Python analyzer
    const { stdout, stderr } = await execFileAsync(
      PYTHON_PATH,
      [PYTHON_SCRIPT, "analyze", uploadedPath],
      {
        maxBuffer: 50 * 1024 * 1024, // 50 MB
        timeout: 60_000, // 60s
      }
    );

    if (stderr) {
      console.warn("[analyze] Python stderr:", stderr);
    }

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(stdout);
    } catch {
      console.error("[analyze] Invalid JSON from Python:", stdout.slice(0, 500));
      return NextResponse.json(
        { error: "Error al parsear el análisis del archivo." },
        { status: 500 }
      );
    }

    if ("error" in analysis) {
      return NextResponse.json({ error: analysis.error }, { status: 422 });
    }

    // Return analysis with session ID
    return NextResponse.json({ sessionId, ...analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze] Error:", message);

    if (message.includes("ENOENT") && message.includes("python")) {
      return NextResponse.json(
        { error: "Python3 no encontrado. Verifica que esté instalado con: python3 --version" },
        { status: 500 }
      );
    }
    if (message.includes("openpyxl")) {
      return NextResponse.json(
        { error: "Dependencia faltante. Ejecuta: pip3 install openpyxl" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Error interno: ${message}` },
      { status: 500 }
    );
  }
}
