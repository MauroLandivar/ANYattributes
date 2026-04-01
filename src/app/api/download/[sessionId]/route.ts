import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const TMP_DIR = "/tmp/anyattributes";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId || !/^[0-9a-f-]{36}$/.test(sessionId)) {
    return NextResponse.json({ error: "ID de sesión inválido." }, { status: 400 });
  }

  const outputPath = path.join(TMP_DIR, sessionId, "output.xlsx");

  try {
    const buffer = await fs.readFile(outputPath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="output_completado.xlsx"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("ENOENT")) {
      return NextResponse.json(
        { error: "Archivo no encontrado. El procesamiento puede no haber terminado aún." },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: `Error al leer el archivo: ${message}` }, { status: 500 });
  }
}
