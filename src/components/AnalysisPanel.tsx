"use client";

export interface AnalysisResult {
  total_products: number;
  red_cells_empty: number;
  blue_cells_empty: number;
  cells: CellInfo[];
  filename: string;
}

export interface CellInfo {
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

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  includeObligatory: boolean;
  includeOptional: boolean;
  onIncludeObligatoryChange: (v: boolean) => void;
  onIncludeOptionalChange: (v: boolean) => void;
  onProcess: () => void;
  isProcessing?: boolean;
}

function StatCard({
  label,
  value,
  color,
  icon,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-3xl font-bold text-[#1e3a5f]">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AnalysisPanel({
  analysis,
  includeObligatory,
  includeOptional,
  onIncludeObligatoryChange,
  onIncludeOptionalChange,
  onProcess,
  isProcessing = false,
}: AnalysisPanelProps) {
  const cellsToProcess =
    (includeObligatory ? analysis.red_cells_empty : 0) +
    (includeOptional ? analysis.blue_cells_empty : 0);

  const estimatedMinutes = Math.max(1, Math.ceil((cellsToProcess * 2) / 60));
  const hasAnythingToProcess = cellsToProcess > 0;

  // Get unique marketplaces
  const marketplaces = [...new Set(analysis.cells.map((c) => c.marketplace).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* File info banner */}
      <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-xl px-5 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#1e3a5f] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1e3a5f] truncate">{analysis.filename}</p>
          {marketplaces.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Marketplace{marketplaces.length > 1 ? "s" : ""}: {marketplaces.join(", ")}
            </p>
          )}
        </div>
        <span className="shrink-0 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          Analizado
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Productos encontrados"
          value={analysis.total_products}
          color="bg-[#1e3a5f]/10"
          sub="filas con ID en fila 5+"
          icon={
            <svg className="w-6 h-6 text-[#1e3a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Atributos obligatorios"
          value={analysis.red_cells_empty}
          color="bg-red-50"
          sub="celdas rojas vacías"
          icon={
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Atributos opcionales"
          value={analysis.blue_cells_empty}
          color="bg-blue-50"
          sub="celdas azules vacías"
          icon={
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="font-semibold text-[#1e3a5f] text-base mb-4">
          Opciones de procesamiento
        </h3>

        <div className="space-y-3">
          {/* Obligatory checkbox */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
            ${includeObligatory
              ? "border-red-300 bg-red-50"
              : "border-slate-200 hover:border-red-200 hover:bg-red-50/30"
            }
          `}>
            <input
              type="checkbox"
              checked={includeObligatory}
              onChange={(e) => onIncludeObligatoryChange(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-red-500 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-red-500 inline-block shrink-0" />
                <span className="font-medium text-slate-800">
                  Atributos obligatorios (celdas rojas)
                </span>
                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                  {analysis.red_cells_empty} celdas
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Atributos requeridos por el marketplace. Recomendado.
              </p>
            </div>
          </label>

          {/* Optional checkbox */}
          <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
            ${includeOptional
              ? "border-blue-300 bg-blue-50"
              : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/30"
            }
          `}>
            <input
              type="checkbox"
              checked={includeOptional}
              onChange={(e) => onIncludeOptionalChange(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-blue-500 cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block shrink-0" />
                <span className="font-medium text-slate-800">
                  Atributos opcionales (celdas azules)
                </span>
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">
                  {analysis.blue_cells_empty} celdas
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Mejora la visibilidad del producto, pero no es obligatorio.
              </p>
            </div>
          </label>
        </div>

        {/* Time estimate */}
        {hasAnythingToProcess && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-[#F97316] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              Se procesarán{" "}
              <strong className="text-[#1e3a5f]">{cellsToProcess} celdas</strong> · Tiempo
              estimado:{" "}
              <strong className="text-[#1e3a5f]">
                ~{estimatedMinutes} {estimatedMinutes === 1 ? "minuto" : "minutos"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Process button */}
      <button
        onClick={onProcess}
        disabled={!hasAnythingToProcess || isProcessing}
        className={`
          w-full py-4 rounded-xl font-semibold text-base transition-all duration-200
          flex items-center justify-center gap-3
          ${hasAnythingToProcess && !isProcessing
            ? "bg-[#F97316] hover:bg-[#EA6C0A] text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-[0.98]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }
        `}
      >
        {isProcessing ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Iniciando...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Iniciar procesamiento con IA
            {hasAnythingToProcess && (
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">
                {cellsToProcess} celdas
              </span>
            )}
          </>
        )}
      </button>

      {!hasAnythingToProcess && (
        <p className="text-center text-sm text-slate-500">
          Selecciona al menos un tipo de atributo para procesar.
        </p>
      )}
    </div>
  );
}
