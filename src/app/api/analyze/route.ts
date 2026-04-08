import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const execFileAsync = promisify(execFile);

const TMP_DIR = "/tmp/anyattributes";
const PYTHON_PATH = process.env.PYTHON_PATH || "python3";
const PYTHON_SCRIPT = path.join(process.cwd(), "python", "excel_processor.py");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: "El archivo debe ser .xlsx o .xls" },
        { status: 400 }
      );
    }

    const sessionId = randomUUID();
    const sessionDir = path.join(TMP_DIR, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadedPath = path.join(sessionDir, "original.xlsx");
    await fs.writeFile(uploadedPath, buffer);

    const { stdout, stderr } = await execFileAsync(
      PYTHON_PATH,
      [PYTHON_SCRIPT, "analyze", uploadedPath],
      {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 60_000,
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

    // Log upload to DB
    await prisma.upload.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        sessionId,
      },
    });

    return NextResponse.json({ sessionId, ...analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stderr = (err as { stderr?: string }).stderr ?? "";
    const stdout = (err as { stdout?: string }).stdout ?? "";
    console.error("[analyze] Error:", message);
    if (stderr) console.error("[analyze] Python stderr:", stderr);
    if (stdout) console.error("[analyze] Python stdout:", stdout);

    if (message.includes("ENOENT") && message.includes("python")) {
      return NextResponse.json(
        { error: "Python3 no encontrado. Verifica que esté instalado con: python3 --version" },
        { status: 500 }
      );
    }
    if (message.includes("openpyxl") || stderr.includes("openpyxl")) {
      return NextResponse.json(
        { error: "Dependencia faltante. Ejecuta: pip3 install openpyxl" },
        { status: 500 }
      );
    }

    const detail = stderr || stdout;
    return NextResponse.json(
      { error: `Error interno: ${detail || message}` },
      { status: 500 }
    );
  }
}
