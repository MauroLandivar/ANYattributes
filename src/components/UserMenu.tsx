"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-[#162d4a] hover:bg-[#0f2236] text-white rounded-lg px-3 py-2 text-sm transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#F97316] flex items-center justify-center text-xs font-bold text-white shrink-0">
          {session.user.email?.[0].toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold leading-none">{session.user.empresa}</p>
          <p className="text-xs text-slate-400 leading-none mt-0.5">{session.user.email}</p>
        </div>
        <svg className="w-3 h-3 text-slate-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-700 truncate">{session.user.email}</p>
              <p className="text-xs text-slate-500 truncate">{session.user.empresa}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
