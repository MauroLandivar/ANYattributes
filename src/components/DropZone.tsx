"use client";

import { useCallback, useState } from "react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
}

export default function DropZone({ onFileSelected, isLoading = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        alert("Por favor selecciona un archivo Excel (.xlsx o .xls)");
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-input"
        className={`
          block w-full border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-200 group
          ${isDragging
            ? "border-[#F97316] bg-orange-50 drag-active scale-[1.01]"
            : "border-slate-300 hover:border-[#F97316] hover:bg-orange-50/30 bg-white"
          }
          ${isLoading ? "pointer-events-none opacity-60" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
          disabled={isLoading}
        />

        <div className="flex flex-col items-center gap-4">
          {/* Icon */}
          <div
            className={`
              w-16 h-16 rounded-2xl flex items-center justify-center
              transition-all duration-200
              ${isDragging
                ? "bg-[#F97316] shadow-lg shadow-orange-200"
                : "bg-slate-100 group-hover:bg-[#F97316]/10"
              }
            `}
          >
            <svg
              className={`w-8 h-8 transition-colors duration-200 ${isDragging ? "text-white" : "text-slate-400 group-hover:text-[#F97316]"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isLoading ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  className="animate-spin"
                />
              ) : (
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </>
              )}
            </svg>
          </div>

          {/* Text */}
          {isLoading ? (
            <div className="text-center">
              <p className="text-[#1e3a5f] font-semibold text-lg">Analizando archivo...</p>
              <p className="text-slate-500 text-sm mt-1">Leyendo colores y atributos</p>
            </div>
          ) : selectedFile ? (
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[#1e3a5f] font-semibold">{selectedFile.name}</p>
              </div>
              <p className="text-slate-500 text-sm">{formatFileSize(selectedFile.size)}</p>
              <p className="text-[#F97316] text-sm mt-2">Click para cambiar archivo</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[#1e3a5f] font-semibold text-lg">
                {isDragging ? "Suelta el archivo aquí" : "Arrastra tu planilla Excel"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                o{" "}
                <span className="text-[#F97316] font-medium underline underline-offset-2">
                  haz click para seleccionar
                </span>
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 font-mono">.xlsx</span>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-500 font-mono">.xls</span>
              </div>
              <p className="text-slate-400 text-xs mt-3">
                Planillas generadas con Apache POI · Máx. 50 MB
              </p>
            </div>
          )}
        </div>
      </label>
    </div>
  );
}
