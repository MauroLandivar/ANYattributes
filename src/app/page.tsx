"use client";

import { useState, useCallback } from "react";
import StepIndicator from "@/components/StepIndicator";
import DropZone from "@/components/DropZone";
import AnalysisPanel, { AnalysisResult } from "@/components/AnalysisPanel";
import ProcessingPanel, { ProcessingLogEntry } from "@/components/ProcessingPanel";
import DownloadPanel from "@/components/DownloadPanel";

type Step = 1 | 2 | 3 | 4;

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Step 2 state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [includeObligatory, setIncludeObligatory] = useState(true);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [includeAll, setIncludeAll] = useState(false);

  // Step 3 state
  const [processingTotal, setProcessingTotal] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [processingLog, setProcessingLog] = useState<ProcessingLogEntry[]>([]);
  const [currentCell, setCurrentCell] = useState("");

  // Step 4 state
  const [processedCount, setProcessedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // --- Step 1→2: Upload & analyze ---
  const handleFileSelected = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Error al analizar el archivo.");
        setIsLoading(false);
        return;
      }

      setAnalysis(data as AnalysisResult);
      setSessionId(data.sessionId);
      setStep(2);
    } catch (err) {
      setError(`Error de conexión: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Step 2→3: Process with AI ---
  const handleProcess = useCallback(async () => {
    if (!analysis || !sessionId) return;

    setError(null);

    // Filter cells based on options
    const cellsToProcess = analysis.cells.filter((c) => {
      if (includeAll) return true;
      if (c.color === "red" && includeObligatory) return true;
      if (c.color === "blue" && includeOptional) return true;
      return false;
    });

    if (cellsToProcess.length === 0) {
      setError("No hay celdas para procesar con las opciones seleccionadas.");
      return;
    }

    const uniqueRows = new Set(cellsToProcess.map((c) => c.row)).size;
    setProcessingTotal(uniqueRows);
    setProcessingCount(0);
    setProcessingLog([]);
    setCurrentCell("");
    setStep(3);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          cells: cellsToProcess,
          originalFilename: analysis.filename,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al iniciar el procesamiento.");
        setStep(2);
        return;
      }

      // Read SSE stream
      const reader = res.body?.getReader();
      if (!reader) {
        setError("No se pudo obtener el stream de respuesta.");
        setStep(2);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr.trim()) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "progress") {
              setProcessingCount(event.processed);
              setCurrentCell(event.product_name || "Producto");
              setProcessingLog((prev) => [
                ...prev,
                {
                  product_name: event.product_name,
                  attributes_filled: event.attributes_filled,
                  attributes_error: event.attributes_error,
                  status: event.status,
                },
              ]);
            } else if (event.type === "done") {
              setProcessedCount(event.processedCount);
              setErrorCount(event.errorCount);
              setStep(4);
            } else if (event.type === "error") {
              setError(event.message);
              setStep(2);
            }
          } catch {
            // Skip malformed SSE event
          }
        }
      }
    } catch (err) {
      setError(`Error de conexión: ${err instanceof Error ? err.message : String(err)}`);
      setStep(2);
    }
  }, [analysis, sessionId, includeObligatory, includeOptional]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setStep(1);
    setSelectedFile(null);
    setAnalysis(null);
    setSessionId("");
    setError(null);
    setIsLoading(false);
    setProcessingCount(0);
    setProcessingTotal(0);
    setProcessingLog([]);
    setCurrentCell("");
    setProcessedCount(0);
    setErrorCount(0);
    setIncludeObligatory(true);
    setIncludeOptional(false);
    setIncludeAll(false);
  }, []);

  return (
    <div>
      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      {/* Error banner */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1e3a5f]">
              Completa tus atributos con IA
            </h1>
            <p className="text-slate-600 mt-3 text-lg">
              Sube tu planilla Excel de ANYMARKET y la IA completará automáticamente
              los atributos vacíos de tus productos.
            </p>
          </div>

          <DropZone onFileSelected={handleFileSelected} isLoading={isLoading} />

          {/* How it works */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              {
                icon: "🔴",
                title: "Celdas rojas",
                desc: "Atributos obligatorios que el marketplace requiere",
              },
              {
                icon: "🔵",
                title: "Celdas azules",
                desc: "Atributos opcionales que mejoran la visibilidad",
              },
              {
                icon: "⚪",
                title: "Fuente blanca",
                desc: "Las celdas completadas por IA tendrán fuente blanca",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-semibold text-[#1e3a5f] mt-2">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Changelog */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Changelog</span>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                {
                  version: "v1.4",
                  date: "Abr 2026",
                  changes: [
                    { fix: "validateValue", desc: "Ahora valida tipos Sí/No y Boolean contra las opciones del dropdown (antes podía escribir un valor libre)" },
                    { fix: "Agrupación por marketplace", desc: "run_sample.py ahora agrupa atributos por fila + marketplace, igual que la API web" },
                    { fix: "Cap de opciones en prompt", desc: "Listas con más de 30 opciones se truncan al armar el prompt (evita overflow de tokens en atributos como tablas de tallas con 2854+ opciones)" },
                    { fix: "Retry en error 429", desc: "Backoff automático ante rate limit de la API (espera 20s, 40s, 60s antes de reintentar)" },
                  ],
                },
                {
                  version: "v1.3",
                  date: "Abr 2026",
                  changes: [
                    { fix: "display_name en prompts", desc: "Usa el label visible (fila 5) como nombre de atributo en el prompt, en lugar del nombre normalizado sin espacios de fila 2" },
                    { fix: "Tipos Sí/No en prompt", desc: "Tipos sí/no, si/no y boolean se incluyen como listado en el prompt de la IA" },
                    { fix: "Número con Unidad", desc: "Nuevo tipo: sugiere formato '10 cm', '500 g' en lugar de solo el número" },
                    { fix: "max_tokens", desc: "Aumentado a 4096 para mayor cobertura de atributos por producto" },
                  ],
                },
                {
                  version: "v1.2",
                  date: "Mar 2026",
                  changes: [
                    { fix: "Detección de estructura", desc: "Auto-detect robusto del inicio de datos: acepta IDs numéricos como int/float/string" },
                    { fix: "Colores Apache POI", desc: "Fallback por XML interno del .xlsx para detectar indexed colors generados por Apache POI" },
                  ],
                },
              ].map((entry) => (
                <div key={entry.version} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-[#1e3a5f] text-white rounded px-2 py-0.5">{entry.version}</span>
                    <span className="text-xs text-slate-400">{entry.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.changes.map((c) => (
                      <li key={c.fix} className="text-xs text-slate-600 flex gap-2">
                        <span className="font-semibold text-[#1e3a5f] shrink-0">{c.fix}:</span>
                        <span>{c.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Analysis */}
      {step === 2 && analysis && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Análisis completado</h2>
            <p className="text-slate-500 mt-1">
              Revisa los resultados y configura el procesamiento
            </p>
          </div>

          <AnalysisPanel
            analysis={analysis}
            includeObligatory={includeObligatory}
            includeOptional={includeOptional}
            includeAll={includeAll}
            onIncludeObligatoryChange={setIncludeObligatory}
            onIncludeOptionalChange={setIncludeOptional}
            onIncludeAllChange={setIncludeAll}
            onProcess={handleProcess}
          />

          <button
            onClick={handleReset}
            className="mt-4 w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            ← Volver y subir otro archivo
          </button>
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">Procesando atributos</h2>
            <p className="text-slate-500 mt-1">
              No cierres esta ventana hasta que el proceso termine
            </p>
          </div>

          <ProcessingPanel
            total={processingTotal}
            processed={processingCount}
            currentCell={currentCell}
            log={processingLog}
          />
        </div>
      )}

      {/* Step 4: Download */}
      {step === 4 && analysis && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1e3a5f]">
              ¡Todo listo!
            </h2>
            <p className="text-slate-500 mt-1">
              Tu planilla está lista para descargar
            </p>
          </div>

          <DownloadPanel
            sessionId={sessionId}
            originalFilename={analysis.filename || selectedFile?.name || "planilla.xlsx"}
            processedCount={processedCount}
            errorCount={errorCount}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
