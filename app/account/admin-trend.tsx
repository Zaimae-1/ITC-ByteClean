"use client";

import { useState } from "react";
import { formatBytes } from "@/lib/scanner/rules";

export type MonthTotal = { month: string; scans: number; deletedBytes: number };

export function AdminTrend({ months }: { months: MonthTotal[] }) {
  const [metric, setMetric] = useState<"scans" | "deleted">("scans");
  const visible = months.slice(-12);
  const max = Math.max(1, ...visible.map((item) => metric === "scans" ? item.scans : item.deletedBytes));
  return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-label="Tren bulanan organisasi">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Perkembangan</p><h3 className="mt-1 text-xl font-bold">Tren bulanan</h3></div><div className="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Ukuran grafik"><button onClick={() => setMetric("scans")} aria-pressed={metric === "scans"} className={`rounded-lg px-3 py-2 text-xs font-semibold ${metric === "scans" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}>Jumlah pindai</button><button onClick={() => setMetric("deleted")} aria-pressed={metric === "deleted"} className={`rounded-lg px-3 py-2 text-xs font-semibold ${metric === "deleted" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600"}`}>Ruang dibebaskan</button></div></div>
    {visible.length === 0 ? <p className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">Belum ada ringkasan pindai yang tersimpan di akun.</p> : <div className="mt-6 space-y-4">{visible.map((item) => {
      const value = metric === "scans" ? item.scans : item.deletedBytes;
      const label = metric === "scans" ? `${item.scans} pindai` : formatBytes(item.deletedBytes);
      return <div key={item.month} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm"><span className="font-medium text-slate-600">{item.month}</span><div className="h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${item.month}: ${label}`}><div className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-400 transition-all duration-300" style={{ width: `${Math.max(3, value / max * 100)}%` }} /></div><span className="min-w-16 text-right font-semibold text-slate-800">{label}</span></div>;
    })}</div>}
    <p className="mt-5 text-xs text-slate-500">Menampilkan hingga 12 bulan terakhir yang memiliki data.</p>
  </section>;
}
