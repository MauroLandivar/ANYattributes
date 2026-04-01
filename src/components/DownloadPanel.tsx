"use client";

interface DownloadPanelProps {
  sessionId: string;
  originalFilename: string;
  processedCount: number;
  errorCount: number;
  onReset: () => void;
}

export default function DownloadPanel({
  sessionId,
  originalFilename,
  processedCount,
  errorCount,
  onReset,
}: DownloadPanelProps) {
  const outputFilename =
    originalFilename.replace(/\.(xlsx|xls)$/i, "") + "_completado.xlsx";

  const handleDownload = () => {
    const url = `/api/download/${encodeURIComponent(sessionId)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-9 h-9 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-2">
          ¡Procesamiento completado!
        </h2>
        <p className="text-slate-600">
          Tu planilla Excel ha sido completada exitosamente con IA.
        </p>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <div className="bg-white rounded-xl border border-green-200 p-4">
            <p className="text-3xl font-bold text-green-600">{processedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Celdas completadas</p>
          </div>
          {errorCount > 0 ? (
            <div className="bg-white rounded-xl border border-red-200 p-4">
              <p className="text-3xl font-bold text-red-500">{errorCount}</p>
              <p className="text-xs text-slate-500 mt-1">Con errores</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <p className="text-3xl font-bold text-[#F97316]">100%</p>
              <p className="text-xs text-slate-500 mt-1">Éxito total</p>
            </div>
          )}
        </div>
      </div>

      {/* File info */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Excel icon */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 shrink-0">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1e3a5f] truncate">{outputFilename}</p>
            <p className="text-sm text-slate-500 mt-1">
              Archivo Excel con atributos completados por IA
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                Formato original preservado
              </span>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                Fuente blanca en celdas IA
              </span>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                Dropdowns intactos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="w-full py-4 bg-[#F97316] hover:bg-[#EA6C0A] text-white rounded-xl font-semibold text-base
          transition-all duration-200 shadow-lg shadow-orange-200 hover:shadow-orange-300
          flex items-center justify-center gap-3 active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Descargar {outputFilename}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full py-3 border-2 border-slate-200 hover:border-[#1e3a5f] text-slate-600
          hover:text-[#1e3a5f] rounded-xl font-medium transition-all duration-200
          flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Procesar otra planilla
      </button>
    </div>
  );
}
