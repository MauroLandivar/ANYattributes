import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import UserMenu from "@/components/UserMenu";
import Sidebar from "@/components/Sidebar";

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
          {/* ── Top header ── */}
          <header className="bg-white border-b border-slate-200 h-14 flex items-center px-5 gap-4 shrink-0 z-30 shadow-sm">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mr-4">
              <div className="bg-[#F97316] rounded-lg p-1.5 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 3L25 21H3L14 3Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 16H18M12 13H16" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="leading-none">
                <span className="font-bold text-base tracking-tight text-slate-800">
                  ANY<span className="text-[#F97316]">attributes</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">by ANYMARKET</p>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Icon actions */}
            <div className="flex items-center gap-1">
              {/* Help */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors" title="Entienda la funcionalidad">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>

              {/* Chat */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Notifications */}
              <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F97316] rounded-full text-[8px] font-bold text-white flex items-center justify-center">1</span>
              </button>

              {/* Grid */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

            {/* User / org menu */}
            <UserMenu />
          </header>

          {/* ── Body: sidebar + content ── */}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />

            <div className="flex-1 overflow-y-auto flex flex-col">
              <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
                {children}
              </main>

              <footer className="border-t border-slate-200 text-slate-400 text-center py-3 text-xs bg-white">
                Powered by{" "}
                <span className="text-[#F97316] font-semibold">ANYMARKET</span>
                {" "}· ANYattributes v1.5
              </footer>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
