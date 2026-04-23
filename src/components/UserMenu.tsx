"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

type Theme = "azul" | "naranja";
type Mode = "light" | "dark";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("light");
  const [theme, setTheme] = useState<Theme>("azul");
  const [copied, setCopied] = useState(false);

  if (!session) return null;

  const orgId = "22449504";

  const copyOI = () => {
    navigator.clipboard.writeText(orgId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const initial = session.user.email?.[0].toUpperCase() ?? "U";

  return (
    <div className="relative">
      {/* Trigger: org name + arrow */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
      >
        <span className="font-medium hidden sm:inline">
          {session.user.empresa || "ANYattributes"}
        </span>
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-20 overflow-hidden">

            {/* User header */}
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F97316] flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {session.user.empresa || "Usuário"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>

              {/* OI */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>OI: {orgId}.</span>
                <button
                  onClick={copyOI}
                  title="Copiar OI"
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                >
                  {copied ? (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {[
                { label: "Mis Datos" },
                { label: "Datos de la Organización" },
                { label: "Facturas" },
                { label: "Idioma", hasArrow: true },
              ].map((item) => (
                <button
                  key={item.label}
                  className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <span>{item.label}</span>
                  {item.hasArrow && (
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Apariencia section */}
              <div className="px-5 py-3 border-t border-slate-100 mt-1">
                <div className="w-full flex items-center justify-between text-sm text-slate-700 mb-3">
                  <span>Apariencia</span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Mode toggle */}
                <p className="text-xs font-medium text-slate-500 mb-2">Modo</p>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setMode("light")}
                    className={`flex items-center justify-center w-10 h-8 rounded-lg border-2 transition-all ${
                      mode === "light"
                        ? "border-[#1e6ec8] bg-[#1e6ec8] text-white"
                        : "border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 110 14A7 7 0 0112 5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setMode("dark")}
                    className={`flex items-center justify-center w-10 h-8 rounded-lg border-2 transition-all ${
                      mode === "dark"
                        ? "border-[#1e6ec8] bg-[#1e6ec8] text-white"
                        : "border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </button>
                </div>

                {/* Theme selector */}
                <p className="text-xs font-medium text-slate-500 mb-2">Tema</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setTheme("azul")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      theme === "azul" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#1e6ec8] shrink-0" />
                    <span className="text-slate-700">Azul</span>
                  </button>
                  <button
                    onClick={() => setTheme("naranja")}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                      theme === "naranja" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#F97316] shrink-0" />
                    <span className="text-slate-700">Naranja</span>
                  </button>
                </div>
              </div>

              {/* Extra links + sign out */}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  Escuela de Marketplace
                </button>
                <button className="w-full text-left px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  Ayuda
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full text-left px-5 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
