"use client";

export interface ProcessingLogEntry {
  product_name: string;
  attributes_filled: number;
  attributes_error: number;
  status: "ok" | "error";
}

interface ProcessingPanelProps {
  total: number;
  processed: number;
  currentCell?: string;
  log: ProcessingLogEntry[];
}

export default function ProcessingPanel({
  total,
  processed,
  currentCell,
  log,
}: ProcessingPanelProps) {
  const percent = total > 0 ? Math.round((processed / total) * 100) : 0;
  const remaining = total - processed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 bg-[#1e3a5f]/5 border border-[#1e3a5f]/15 rounded-2xl px-6 py-3">
          <svg
            className="w-6 h-6 text-[#F97316] animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div className="text-left">
            <p className="font-semibold text-[#1e3a5f]">Procesando con IA...</p>
            {currentCell && (
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-64">
                {currentCell}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-700">Progreso general</span>
          <span className="text-sm font-bold text-[#1e3a5f]">
            {processed} / {total} productos
          </span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-500 progress-animated"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-500">
            {remaining > 0 ? `${remaining} productos restantes` : "Finalizando..."}
          </span>
          <span className="text-xs font-bold text-[#F97316]">{percent}%</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#F97316]">{processed}</p>
          <p className="text-xs text-slate-500 mt-1">Procesados</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-400">{remaining}</p>
          <p className="text-xs text-slate-500 mt-1">Pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-500">
            {log.reduce((acc, l) => acc + (l.attributes_filled || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Atributos completados</p>
        </div>
      </div>

      {/* Processing log */}
      {log.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1e3a5f]">
              Registro de procesamiento
            </h3>
            <span className="text-xs text-slate-400">{log.length} productos</span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {[...log].reverse().map((entry, i) => (
              <div key={i} className="log-item px-5 py-3 flex items-center gap-3">
                {/* Status icon */}
                {entry.status === "ok" ? (
                  <svg
                    className="w-4 h-4 text-green-500 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-red-400 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {entry.product_name || "Producto sin nombre"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.attributes_filled} atributo{entry.attributes_filled !== 1 ? "s" : ""} completado{entry.attributes_filled !== 1 ? "s" : ""}
                    {entry.attributes_error > 0 && (
                      <span className="text-red-400"> · {entry.attributes_error} error{entry.attributes_error !== 1 ? "es" : ""}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
