"use client";

import { useActionState, useState } from "react";
import { authenticate, type AuthState } from "./actions";

const initialState: AuthState = { error: "", success: "" };

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState(authenticate, initialState);
  return (
    <div className="mt-8 rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8">
      <div className="flex gap-2" role="tablist" aria-label="Pilihan akun">
        <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")} className={`rounded-lg px-5 py-2 font-semibold ${mode === "login" ? "bg-[#2e7066] text-white" : "text-[#425b55] hover:bg-[#eef5ef]"}`}>Masuk</button>
        <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => setMode("signup")} className={`rounded-lg px-5 py-2 font-semibold ${mode === "signup" ? "bg-[#2e7066] text-white" : "text-[#425b55] hover:bg-[#eef5ef]"}`}>Daftar</button>
      </div>
      <form action={action} className="mt-6 grid gap-5">
        <input type="hidden" name="mode" value={mode} />
        <label className="grid gap-2 text-sm font-semibold text-slate-800">Email
          <input name="email" type="email" autoComplete="email" required className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-teal-600" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-800">Kata sandi
          <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required className="rounded-lg border border-slate-300 px-4 py-3 font-normal outline-none focus:border-teal-600" />
        </label>
        {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
        {state.success && <p role="status" className="rounded-lg bg-teal-50 px-4 py-3 text-sm text-teal-800">{state.success}</p>}
        <button disabled={pending} className="rounded-lg bg-[#2e7066] px-5 py-3 font-semibold text-white hover:bg-[#24594f] disabled:opacity-60">{pending ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}</button>
      </form>
    </div>
  );
}
