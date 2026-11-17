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
  return <div className="overflow-hidden rounded-3xl border border-[#d5e2da] bg-white text-[#243331] shadow-lg shadow-[#8ca99b]/10">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3ebe5] px-6 py-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#438577]" /><span className="text-sm font-semibold">Pratinjau ByteClean</span></div><span className="rounded-full bg-[#f5efe0] px-3 py-1 text-xs font-semibold text-[#755c2d]">DATA CONTOH</span></div>
    <div className="p-6 sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm text-[#526a63]">Potensi ruang</p><p className="mt-1 text-3xl font-bold tracking-tight text-[#285e53]">{formatBytes(summary.potentialBytes)}</p></div><div className="rounded-2xl border border-[#dce7e1] bg-[#f5f8f5] px-4 py-3 text-center"><p className="text-xs text-[#526a63]">Skor</p><p className="text-2xl font-bold">{summary.score}<span className="text-sm text-[#526a63]">/100</span></p></div></div>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e4ece5]"><div className="h-full rounded-full bg-[#438577]" style={{ width: `${summary.score ?? 0}%` }} /></div>
      <p className="mt-7 text-sm font-semibold text-[#526a63]">Jelajahi contoh temuan</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Kategori contoh">
        {CATEGORIES.map((category) => <button key={category} onClick={() => setActive(category)} aria-pressed={active === category} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${active === category ? "bg-[#2e7066] text-white" : "border border-[#cbd9d0] text-[#425b55] hover:border-[#438577] hover:bg-[#f0f5ef]"}`}>{CATEGORY_LABELS[category]}</button>)}
      </div>
      <div className="mt-3 min-h-40 rounded-2xl border border-[#dce7e1] bg-[#f8faf8] p-4">
        <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{CATEGORY_LABELS[active]}</span><span className="text-[#526a63]">{summary.categories[active].count} file perlu ditinjau</span></div>
        <div className="mt-3 space-y-2">{visible.length ? visible.map((file) => <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e3ebe5] bg-white px-3 py-2 text-xs"><span className="min-w-0 truncate text-[#314b43]">{file.name}</span><span className="shrink-0 font-semibold text-[#285e53]">{formatBytes(file.size)}</span></div>) : <p className="py-8 text-center text-sm text-[#526a63]">Tidak ada contoh pada kategori ini.</p>}</div>
      </div>
      <Link href="/scan?demo=1" className="mt-5 flex min-h-12 items-center justify-between rounded-xl bg-[#2e7066] px-4 py-3 font-semibold text-white transition hover:bg-[#24594f]">Buka demo lengkap <span aria-hidden="true">↗</span></Link>
    </div>
  </div>;
}
