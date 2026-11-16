"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatBytes } from "@/lib/scanner/rules";
import { syncPendingScans } from "@/lib/supabase/sync";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/scanner/types";

export function HistoryList() {
  const records = useLiveQuery(() => db.scans.orderBy("createdAt").reverse().toArray(), []);
  const [period, setPeriod] = useState<"all" | "30d">("all");
  const [sort, setSort] = useState<"recent" | "oldest" | "potential">("recent");
  const [cutoff, setCutoff] = useState(0);
  useEffect(() => { syncPendingScans().catch(() => {}); }, []);
  const displayed = useMemo(() => {
    return (records ?? []).filter((record) => period === "all" || record.createdAt >= cutoff).sort((a, b) => {
      if (sort === "oldest") return a.createdAt - b.createdAt;
      if (sort === "potential") return b.summary.potentialBytes - a.summary.potentialBytes;
      return b.createdAt - a.createdAt;
    });
  }, [records, period, sort, cutoff]);
  const totalDeleted = displayed.reduce((sum, record) => sum + record.deletedBytes, 0);
  const totalPotential = displayed.reduce((sum, record) => sum + record.summary.potentialBytes, 0);
  const scored = displayed.filter((record) => record.summary.score !== null);
  const averageScore = scored.length ? Math.round(scored.reduce((sum, record) => sum + (record.summary.score ?? 0), 0) / scored.length) : null;

  async function clearHistory() {
    if (!window.confirm("Hapus seluruh riwayat lokal di browser ini? Tindakan ini tidak dapat dibatalkan.")) return;
    await db.scans.clear();
  }

  if (records === undefined) return <p className="mt-10 text-slate-500">Memuat riwayat lokal...</p>;
  if (records.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="text-lg font-semibold">Belum ada pemindaian</h2>
        <p className="mt-2 text-slate-600">Pindai folder untuk menyimpan ringkasan pertama Anda.</p>
        <Link href="/scan" className="mt-5 inline-block rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white">Pindai folder</Link>
      </div>
    );
  }

  return (
    <section className="mt-9">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm text-slate-300">Potensi dari riwayat</p><p className="mt-2 text-2xl font-bold">{formatBytes(totalPotential)}</p></div>
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5"><p className="text-sm text-teal-800">Berhasil dibebaskan</p><p className="mt-2 text-2xl font-bold text-teal-950">{formatBytes(totalDeleted)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Rata-rata skor</p><p className="mt-2 text-2xl font-bold">{averageScore === null ? "—" : `${averageScore}/100`}</p></div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="mt-6 text-sm text-slate-600">{displayed.length} dari {records.length} ringkasan ditampilkan.</p>
        <button onClick={clearHistory} className="text-sm font-semibold text-red-700 hover:underline">Hapus riwayat lokal</button>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Periode<select value={period} onChange={(event) => { const next = event.target.value as "all" | "30d"; if (next === "30d") setCutoff(Date.now() - 30 * 24 * 60 * 60 * 1000); setPeriod(next); }} className="min-w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"><option value="all">Semua waktu</option><option value="30d">30 hari terakhir</option></select></label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Urutan<select value={sort} onChange={(event) => setSort(event.target.value as "recent" | "oldest" | "potential")} className="min-w-44 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900"><option value="recent">Terbaru dulu</option><option value="oldest">Terlama dulu</option><option value="potential">Potensi terbesar</option></select></label>
      </div>
      <div className="grid gap-4">
        {displayed.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-7 text-slate-600">Tidak ada pemindaian dalam periode ini.</p>}
        {displayed.map((record) => (
          <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-950">{new Date(record.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</h2>
              <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{record.remoteId ? "Tersinkron" : "Di perangkat ini"}</span><span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">Skor {record.summary.score ?? "—"}/100</span></div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
              <div><dt className="text-slate-500">File</dt><dd className="mt-1 font-semibold">{record.summary.totalFiles.toLocaleString("id-ID")}</dd></div>
              <div><dt className="text-slate-500">Terpindai</dt><dd className="mt-1 font-semibold">{formatBytes(record.summary.totalBytes)}</dd></div>
              <div><dt className="text-slate-500">Potensi</dt><dd className="mt-1 font-semibold">{formatBytes(record.summary.potentialBytes)}</dd></div>
              <div><dt className="text-slate-500">Berhasil dihapus</dt><dd className="mt-1 font-semibold">{formatBytes(record.deletedBytes)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Ambang: besar ≥ {formatBytes(record.settings.largeFileBytes)}, lama ≥ {record.settings.oldFileDays} hari, installer ≥ {record.settings.oldInstallerDays} hari.</p>
            <details className="mt-5 rounded-xl bg-slate-50 px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-teal-800">Lihat rincian kategori</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{CATEGORIES.map((category) => <div key={category} className="flex justify-between gap-3 border-b border-slate-200 pb-2 text-sm"><span className="text-slate-600">{CATEGORY_LABELS[category]}</span><span className="font-semibold">{record.summary.categories[category].count} · {formatBytes(record.summary.categories[category].bytes)}</span></div>)}</div><p className="mt-3 text-xs text-slate-500">Satu file dapat masuk lebih dari satu kategori.</p></details>
          </article>
        ))}
      </div>
    </section>
  );
}
