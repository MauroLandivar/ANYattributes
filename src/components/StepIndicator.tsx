"use client";

const STEPS = [
  { id: 1, label: "Subir", icon: "upload" },
  { id: 2, label: "Analizar", icon: "chart" },
  { id: 3, label: "Procesar", icon: "cpu" },
  { id: 4, label: "Descargar", icon: "download" },
];

function StepIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "white" : "#94a3b8";
  const size = 18;

  if (type === "upload")
    return (
      <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    );
  if (type === "chart")
    return (
      <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  if (type === "cpu")
    return (
      <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    );
  // download
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;
        const isFuture = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-300
                  ${isCompleted ? "bg-[#F97316] text-white shadow-md shadow-orange-200" : ""}
                  ${isActive ? "bg-[#1e3a5f] text-white shadow-lg ring-4 ring-[#F97316]/20" : ""}
                  ${isFuture ? "bg-slate-200 text-slate-400" : ""}
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <StepIcon type={step.icon} active={isActive} />
                )}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium whitespace-nowrap
                  ${isActive ? "text-[#1e3a5f] font-bold" : ""}
                  ${isCompleted ? "text-[#F97316]" : ""}
                  ${isFuture ? "text-slate-400" : ""}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`
                  h-0.5 w-16 sm:w-24 mx-1 -mt-5 transition-all duration-500
                  ${step.id < currentStep ? "bg-[#F97316]" : "bg-slate-200"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
