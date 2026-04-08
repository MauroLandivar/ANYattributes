"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

type Tab = "login" | "register";
type Provider = "claude" | "gpt";

const ERROR_MESSAGES: Record<string, string> = {
  email_exists: "Este email ya tiene una cuenta. Iniciá sesión con tu contraseña.",
  invalid_api_key: "API key incorrecta. Verificá que sea una key válida.",
  no_balance: "Sin saldo en tu API key. Recargá tu cuenta antes de continuar.",
  CredentialsSignin: "Contraseña incorrecta. Intentá de nuevo.",
};

export default function AuthModal({ onSuccess, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regEmpresa, setRegEmpresa] = useState("");
  const [regApiKey, setRegApiKey] = useState("");
  const [regProvider, setRegProvider] = useState<Provider>("claude");
  const [showKey, setShowKey] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });
      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? "Error al iniciar sesión.");
      } else if (result?.ok) {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          empresa: regEmpresa,
          apiKey: regApiKey,
          provider: regProvider,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === "email_exists") {
          setTab("login");
          setLoginEmail(regEmail);
          setError(ERROR_MESSAGES.email_exists);
          return;
        }
        setError(ERROR_MESSAGES[data.error] ?? data.error ?? "Error al registrarse.");
        return;
      }

      // Auto-login after registration
      const loginResult = await signIn("credentials", {
        email: regEmail,
        password: regPassword,
        redirect: false,
      });
      if (loginResult?.ok) {
        onSuccess();
      } else {
        setTab("login");
        setLoginEmail(regEmail);
        setError("Registro exitoso. Por favor iniciá sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#1e3a5f] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-xl">
              ANY<span className="text-[#F97316]">attributes</span>
            </h2>
            <p className="text-slate-300 text-sm mt-0.5">
              Para llenar tus atributos, primero identificate 👋
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "login"
                ? "text-[#1e3a5f] border-b-2 border-[#F97316]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Ingresar
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              tab === "register"
                ? "text-[#1e3a5f] border-b-2 border-[#F97316]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Soy nuevo/a
          </button>
        </div>

        <div className="px-6 py-5">
          {/* Error banner */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#162d4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
              <p className="text-center text-xs text-slate-500">
                ¿No tenés cuenta?{" "}
                <button type="button" onClick={() => { setTab("register"); setError(null); }} className="text-[#F97316] font-semibold hover:underline">
                  Registrate aquí
                </button>
              </p>
            </form>
          )}

          {/* REGISTER FORM */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Empresa</label>
                <input
                  type="text"
                  required
                  value={regEmpresa}
                  onChange={(e) => setRegEmpresa(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                />
              </div>

              {/* Provider selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Proveedor de IA</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegProvider("claude")}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      regProvider === "claude"
                        ? "border-[#F97316] bg-orange-50 text-[#F97316]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    Claude (Anthropic)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegProvider("gpt")}
                    className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                      regProvider === "gpt"
                        ? "border-[#F97316] bg-orange-50 text-[#F97316]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    ChatGPT (OpenAI)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  API Key de {regProvider === "claude" ? "Claude" : "ChatGPT"}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    required
                    value={regApiKey}
                    onChange={(e) => setRegApiKey(e.target.value)}
                    placeholder={regProvider === "claude" ? "sk-ant-api03-..." : "sk-..."}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKey ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tu key es encriptada con AES-256 y nunca visible para nadie.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#F97316] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Validando y registrando..." : "Crear cuenta"}
              </button>

              {loading && (
                <p className="text-center text-xs text-slate-500 animate-pulse">
                  Validando tu API key con {regProvider === "claude" ? "Anthropic" : "OpenAI"}...
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
