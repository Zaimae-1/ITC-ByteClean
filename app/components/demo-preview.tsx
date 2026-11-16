"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createDemoFiles } from "@/lib/scanner/demo";
import { calculateSummary, formatBytes, potentialFileIds } from "@/lib/scanner/rules";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/scanner/types";

const files = createDemoFiles();
const summary = calculateSummary(files);
const candidateIds = potentialFileIds(files);

export function DemoPreview() {
  const [active, setActive] = useState<Category>("largeOld");
  const visible = useMemo(() => files.filter((file) => candidateIds.has(file.id) && file.categories.includes(active)).slice(0, 3), [active]);
  return <div className="overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-950 text-white shadow-2xl shadow-teal-950/20">
    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-teal-400" /><span className="text-sm font-semibold">Pratinjau ByteClean</span></div><span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">DATA CONTOH</span></div>
    <div className="p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-slate-400">Potensi ruang</p><p className="mt-1 text-4xl font-bold tracking-tight text-teal-300">{formatBytes(summary.potentialBytes)}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center"><p className="text-xs text-slate-400">Skor</p><p className="text-2xl font-bold">{summary.score}<span className="text-sm text-slate-500">/100</span></p></div></div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-300" style={{ width: `${summary.score ?? 0}%` }} /></div>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Jelajahi contoh temuan</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Kategori contoh">
        {CATEGORIES.map((category) => <button key={category} onClick={() => setActive(category)} aria-pressed={active === category} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${active === category ? "bg-teal-400 text-slate-950" : "border border-white/15 text-slate-300 hover:border-teal-400 hover:text-white"}`}>{CATEGORY_LABELS[category]}</button>)}
      </div>
      <div className="mt-3 min-h-40 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex justify-between gap-3 text-sm"><span className="font-semibold">{CATEGORY_LABELS[active]}</span><span className="text-slate-400">{summary.categories[active].count} kandidat</span></div>
        <div className="mt-3 space-y-2">{visible.length ? visible.map((file) => <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2 text-xs"><span className="min-w-0 truncate text-slate-200">{file.name}</span><span className="shrink-0 font-semibold text-teal-200">{formatBytes(file.size)}</span></div>) : <p className="py-8 text-center text-sm text-slate-400">Tidak ada contoh pada kategori ini.</p>}</div>
      </div>
      <Link href="/scan?demo=1" className="mt-5 flex items-center justify-between rounded-xl bg-teal-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-teal-300">Buka demo lengkap <span aria-hidden="true">↗</span></Link>
    </div>
  </div>;
}
