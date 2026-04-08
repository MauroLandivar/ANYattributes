import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import UserMenu from "@/components/UserMenu";

export const metadata: Metadata = {
  title: "ANYattributes — ANYMARKET",
  description: "Procesador inteligente de atributos de productos para ANYMARKET",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-[#f5f7fa] flex flex-col">
        <Providers>
          {/* Header */}
          <header className="bg-[#1e3a5f] shadow-lg">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
              {/* Logo ANYMARKET */}
              <div className="flex items-center gap-2">
                <div className="bg-[#F97316] rounded-lg p-2 flex items-center justify-center">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 28 28"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 3L25 21H3L14 3Z"
                      fill="white"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 16H18M12 13H16"
                      stroke="#F97316"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-bold text-xl tracking-tight">
                    ANY<span className="text-[#F97316]">attributes</span>
                  </span>
                  <p className="text-slate-400 text-xs leading-none mt-0.5">
                    by ANYMARKET
                  </p>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
                  <svg
                    className="w-4 h-4 text-[#F97316]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                    />
                  </svg>
                  Procesador de atributos con IA
                </div>
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-[#1e3a5f] text-slate-400 text-center py-4 text-sm mt-auto">
            <span>
              Powered by{" "}
              <span className="text-[#F97316] font-semibold">ANYMARKET</span>
              {" "}· ANYattributes v1.5
            </span>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
