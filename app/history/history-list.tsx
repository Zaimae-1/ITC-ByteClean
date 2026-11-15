"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatBytes } from "@/lib/scanner/rules";

export function HistoryList() {
  const records = useLiveQuery(() => db.scans.orderBy("createdAt").reverse().toArray(), []);

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{records.length} ringkasan tersimpan di browser ini.</p>
        <button onClick={clearHistory} className="text-sm font-semibold text-red-700 hover:underline">Hapus riwayat lokal</button>
      </div>
      <div className="grid gap-4">
        {records.map((record) => (
          <article key={record.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-950">{new Date(record.createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</h2>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-800">Skor {record.summary.score ?? "—"}/100</span>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-4">
              <div><dt className="text-slate-500">File</dt><dd className="mt-1 font-semibold">{record.summary.totalFiles.toLocaleString("id-ID")}</dd></div>
              <div><dt className="text-slate-500">Terpindai</dt><dd className="mt-1 font-semibold">{formatBytes(record.summary.totalBytes)}</dd></div>
              <div><dt className="text-slate-500">Potensi</dt><dd className="mt-1 font-semibold">{formatBytes(record.summary.potentialBytes)}</dd></div>
              <div><dt className="text-slate-500">Berhasil dihapus</dt><dd className="mt-1 font-semibold">{formatBytes(record.deletedBytes)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Ambang: besar ≥ {formatBytes(record.settings.largeFileBytes)}, lama ≥ {record.settings.oldFileDays} hari, installer ≥ {record.settings.oldInstallerDays} hari.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
