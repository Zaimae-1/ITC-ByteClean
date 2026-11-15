"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { syncScanRecord } from "@/lib/supabase/sync";
import { createDemoFiles } from "@/lib/scanner/demo";
import { filesToCsv } from "@/lib/scanner/csv";
import {
  calculateSummary,
  formatBytes,
  validateDeletionSelection,
} from "@/lib/scanner/rules";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type ScanFile,
  type ScanSettings,
} from "@/lib/scanner/types";
import type { ScanResponse, ScanSource } from "@/lib/scanner/worker-protocol";

type Phase = "idle" | "collecting" | "hashing" | "complete" | "deleting";
type Filter = Category | "all";
type WritableDirectory = FileSystemDirectoryHandle & {
  requestPermission(options: { mode: "readwrite" }): Promise<PermissionState>;
};

export function ScanWorkspace({ initialDemo, settings }: { initialDemo: boolean; settings: ScanSettings }) {
  const [files, setFiles] = useState<ScanFile[]>(() => initialDemo ? createDemoFiles() : []);
  const [phase, setPhase] = useState<Phase>(initialDemo ? "complete" : "idle");
  const [demo, setDemo] = useState(initialDemo);
  const [sourceName, setSourceName] = useState(initialDemo ? "Data contoh" : "");
  const [rootHandle, setRootHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [readOnly, setReadOnly] = useState(true);
  const [scannedCount, setScannedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [hashProgress, setHashProgress] = useState({ done: 0, total: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletedBytes, setDeletedBytes] = useState(0);
  const [deletedCount, setDeletedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const scanRecordPromiseRef = useRef<Promise<number | undefined> | null>(null);

  useEffect(() => () => workerRef.current?.terminate(), []);

  const summary = useMemo(() => calculateSummary(files, ignoredIds), [files, ignoredIds]);
  const selectedFiles = useMemo(
    () => files.filter((file) => selectedIds.has(file.id)),
    [files, selectedIds],
  );
  const selectedBytes = selectedFiles.reduce((total, file) => total + file.size, 0);
  const visibleFiles = useMemo(
    () => files.filter((file) =>
      file.categories.length > 0 &&
      (filter === "all" || file.categories.includes(filter)) &&
      (search === "" || file.path.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID"))),
    ),
    [files, filter, search],
  );
  const hasResults = phase === "complete" || phase === "deleting";
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const canDelete = !demo && !readOnly && !isMobile && rootHandle !== null;
  const hasExportableFiles = files.some((file) => file.categories.length > 0 && !ignoredIds.has(file.id));

  function startWorker(source: ScanSource, folderName: string, handle: FileSystemDirectoryHandle | null) {
    workerRef.current?.terminate();
    setFiles([]);
    setSelectedIds(new Set());
    setIgnoredIds(new Set());
    setDemo(false);
    setSourceName(folderName);
    setRootHandle(handle);
    setReadOnly(handle === null);
    setPhase("collecting");
    setScannedCount(0);
    setSkippedCount(0);
    setHashProgress({ done: 0, total: 0 });
    setDeletedBytes(0);
    setDeletedCount(0);
    scanRecordPromiseRef.current = null;
    setError("");
    setMessage("");
    const worker = new Worker(new URL("../../lib/scanner/scan.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<ScanResponse>) => {
      const response = event.data;
      if (response.type === "progress") {
        setPhase(response.phase);
        setScannedCount(response.scannedFiles);
        if (response.phase === "collecting") setSkippedCount(response.skippedFiles);
        else setHashProgress({ done: response.processedBytes, total: response.totalBytes });
      } else if (response.type === "complete") {
        setFiles(response.files);
        setSkippedCount(response.skippedFiles);
        setPhase("complete");
        setMessage(`Pemindaian selesai. ${response.files.length.toLocaleString("id-ID")} file diperiksa.`);
        const record = {
          clientId: crypto.randomUUID(),
          createdAt: Date.now(),
          summary: calculateSummary(response.files),
          settings,
          deletedBytes: 0,
          deletedFiles: 0,
        };
        const saved = db.scans.add(record);
        scanRecordPromiseRef.current = saved;
        saved.catch(() => setError("Hasil tampil, tetapi riwayat lokal tidak dapat disimpan di browser ini."));
        saved.then((id) => syncScanRecord({ ...record, id })).catch(() => {});
        worker.terminate();
        workerRef.current = null;
      } else {
        setError(response.message);
        setPhase("idle");
        worker.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = () => {
      setError("Pemindaian gagal di browser ini. Coba pilih subfolder yang lebih kecil.");
      setPhase("idle");
      worker.terminate();
      workerRef.current = null;
    };
    worker.postMessage({ type: "start", source, settings });
  }

  async function pickFolder() {
    const picker = (window as Window & {
      showDirectoryPicker?: (options: { mode: "read" }) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker;
    if (!picker) {
      inputRef.current?.setAttribute("webkitdirectory", "");
      inputRef.current?.click();
      return;
    }
    try {
      const handle = await picker.call(window, { mode: "read" });
      startWorker({ kind: "directory", handle }, handle.name, handle);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError("Folder tidak dapat dibuka. Periksa izin browser lalu coba lagi.");
    }
  }

  function pickReadOnlyFolder() {
    inputRef.current?.setAttribute("webkitdirectory", "");
    inputRef.current?.click();
  }

  function chooseFallback(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    if (chosen.length === 0) return;
    const entries = chosen.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
    startWorker({ kind: "files", entries }, entries[0].path.split("/")[0], null);
    event.target.value = "";
  }

  function cancelScan() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setPhase("idle");
    setMessage("Pemindaian dibatalkan. Tidak ada file yang diubah.");
  }

  function loadDemo() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setFiles(createDemoFiles());
    setPhase("complete");
    setDemo(true);
    setReadOnly(true);
    setRootHandle(null);
    setSourceName("Data contoh");
    setSelectedIds(new Set());
    setIgnoredIds(new Set());
    setDeletedBytes(0);
    setDeletedCount(0);
    scanRecordPromiseRef.current = null;
    setError("");
    setMessage("Mode demo aktif. Data ini sintetis dan tidak berasal dari perangkat Anda.");
  }

  function toggleSelection(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const invalid = validateDeletionSelection(files, next);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSelectedIds(next);
    setError("");
  }

  function toggleIgnored(id: string) {
    const next = new Set(ignoredIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setIgnoredIds(next);
    const selection = new Set(selectedIds);
    selection.delete(id);
    setSelectedIds(selection);
  }

  function exportCsv() {
    const exportFiles = selectedFiles.length
      ? selectedFiles
      : files.filter((file) => file.categories.length > 0 && !ignoredIds.has(file.id));
    if (exportFiles.length === 0) return;
    const blob = new Blob(["\uFEFF", filesToCsv(exportFiles)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `byteclean-hasil-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function deleteSelected() {
    setShowConfirm(false);
    const invalid = validateDeletionSelection(files, selectedIds);
    if (invalid || !rootHandle || readOnly || demo) {
      setError(invalid ?? "Penghapusan tidak tersedia untuk hasil ini.");
      return;
    }
    setError("");
    try {
      const permission = await (rootHandle as WritableDirectory).requestPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        setError("Izin tulis tidak diberikan. Tidak ada file yang dihapus.");
        return;
      }
    } catch {
      setError("Browser tidak dapat meminta izin tulis untuk folder ini.");
      return;
    }

    setPhase("deleting");
    const deleted = new Set<string>();
    const failures: string[] = [];
    let bytes = 0;
    for (const file of selectedFiles) {
      try {
        if (!file.parentDirectory) throw new Error("Handle folder tidak tersedia");
        const current = await file.parentDirectory.getFileHandle(file.name);
        const metadata = await current.getFile();
        if (metadata.size !== file.size || metadata.lastModified !== file.lastModified) {
          throw new Error("File berubah sejak pemindaian");
        }
        await file.parentDirectory.removeEntry(file.name);
        deleted.add(file.id);
        bytes += file.size;
      } catch {
        failures.push(file.path);
      }
    }
    setFiles((current) => current.filter((file) => !deleted.has(file.id)));
    setSelectedIds(new Set());
    setDeletedBytes((current) => current + bytes);
    setDeletedCount((current) => current + deleted.size);
    if (scanRecordPromiseRef.current) {
      try {
        const recordId = await scanRecordPromiseRef.current;
        if (recordId !== undefined) {
          const changes = { deletedBytes: deletedBytes + bytes, deletedFiles: deletedCount + deleted.size };
          await db.scans.update(recordId, changes);
          const record = await db.scans.get(recordId);
          if (record) await syncScanRecord(record);
        }
      } catch {
        // The scan remains usable even when browser storage is unavailable.
      }
    }
    setPhase("complete");
    setMessage(
      `${deleted.size} file dihapus; ${formatBytes(bytes)} dibebaskan.` +
      (failures.length ? ` ${failures.length} gagal atau berubah sejak scan: ${failures.slice(0, 3).join(", ")}.` : ""),
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Pemindaian lokal</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Pindai folder Anda</h1>
          <p className="mt-3 max-w-2xl text-slate-600">File dibaca dan dianalisis di browser. Tidak ada nama, jalur, hash, atau isi file yang dikirim ke server.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input ref={inputRef} type="file" multiple onChange={chooseFallback} className="sr-only" aria-label="Pilih folder" />
          <button onClick={pickFolder} disabled={phase === "collecting" || phase === "hashing" || phase === "deleting"} className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50">
            Pilih folder
          </button>
          <button onClick={loadDemo} disabled={phase === "deleting"} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:border-teal-600 disabled:opacity-50">Coba demo</button>
          <button onClick={pickReadOnlyFolder} disabled={phase === "collecting" || phase === "hashing" || phase === "deleting"} className="px-2 py-3 text-sm font-semibold text-teal-700 hover:underline disabled:opacity-50">Pindai mode baca saja</button>
        </div>
      </div>

      {demo && <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">Mode demo — seluruh file dan angka di halaman ini adalah contoh sintetis. Penghapusan tidak tersedia.</div>}
      {!canDelete && hasResults && !demo && <div className="mt-7 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">Mode baca saja: pindai dan ekspor CSV tersedia, tetapi hasil ini tidak memiliki izin untuk menghapus file lokal.</div>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</p>}

      {(phase === "collecting" || phase === "hashing") && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6" aria-live="polite">
          <p className="font-semibold text-slate-900">{phase === "collecting" ? "Membaca folder..." : "Memverifikasi duplikat..."}</p>
          <p className="mt-1 text-sm text-slate-600">{scannedCount.toLocaleString("id-ID")} file dibaca{skippedCount ? `; ${skippedCount} dilewati` : ""}.</p>
          {phase === "hashing" && hashProgress.total > 0 && (
            <progress className="mt-4 w-full accent-teal-700" value={hashProgress.done} max={hashProgress.total} aria-label="Progres hash" />
          )}
          {phase === "collecting" && <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/3 animate-pulse rounded-full bg-teal-600" /></div>}
          <button onClick={cancelScan} className="mt-5 text-sm font-semibold text-red-700 hover:underline">Batal</button>
        </section>
      )}

      {hasResults && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Folder: <strong className="text-slate-900">{sourceName}</strong>{skippedCount ? ` · ${skippedCount} file tidak dapat dibaca` : ""}</p>
            <Link href="/score" className="text-sm font-semibold text-teal-700 hover:underline">Bagaimana skor dihitung?</Link>
          </div>
          <section aria-label="Ringkasan pemindaian" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="File diperiksa" value={summary.totalFiles.toLocaleString("id-ID")} />
            <SummaryCard label="Ukuran terpindai" value={formatBytes(summary.totalBytes)} />
            <SummaryCard label="Potensi ruang" value={formatBytes(summary.potentialBytes)} />
            <SummaryCard label="Skor kebersihan" value={summary.score === null ? "—" : `${summary.score}/100`} />
          </section>
          {deletedBytes > 0 && <p className="mt-4 text-sm font-semibold text-teal-800">Berhasil dibebaskan dalam sesi ini: {formatBytes(deletedBytes)}</p>}

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Hasil dan tinjauan</h2>
                <p className="mt-1 text-sm text-slate-600">Tidak ada file yang terpilih otomatis. Kategori adalah petunjuk, bukan keputusan hapus.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={exportCsv} disabled={!hasExportableFiles && selectedFiles.length === 0} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-teal-600 disabled:opacity-50">Ekspor CSV</button>
                {canDelete && <button onClick={() => setShowConfirm(true)} disabled={selectedIds.size === 0 || phase === "deleting"} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">Hapus terpilih</button>}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Semua</FilterButton>
              {CATEGORIES.map((category) => (
                <FilterButton key={category} active={filter === category} onClick={() => setFilter(category)}>
                  {CATEGORY_LABELS[category]} <span className="opacity-70">{summary.categories[category].count}</span>
                </FilterButton>
              ))}
            </div>
            <label className="mt-5 block max-w-lg">
              <span className="sr-only">Cari file dalam hasil</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau jalur file" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600" />
            </label>
            <p className="mt-3 text-sm text-slate-500">{visibleFiles.length.toLocaleString("id-ID")} file dalam tampilan{visibleFiles.length > 200 ? " · tampil 200 pertama, gunakan pencarian untuk mempersempit" : ""}.</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {visibleFiles.length === 0 && <p className="px-5 py-9 text-center text-slate-500">Tidak ada file pada kategori ini.</p>}
              {visibleFiles.slice(0, 200).map((file) => {
                const ignored = ignoredIds.has(file.id);
                return (
                  <div key={file.id} className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:flex-row sm:items-center">
                    <label className="flex min-w-0 flex-1 items-start gap-3">
                      <input type="checkbox" checked={selectedIds.has(file.id)} disabled={ignored || !canDelete} onChange={() => toggleSelection(file.id)} className="mt-1 size-4 accent-teal-700 disabled:opacity-50" aria-label={`Pilih ${file.path}`} />
                      <span className="min-w-0">
                        <span className="block break-all font-medium text-slate-900">{file.name}</span>
                        <span className="block break-all text-xs text-slate-500">{file.path}</span>
                        <span className="mt-1 block text-xs text-slate-600">{file.categories.map((category) => CATEGORY_LABELS[category]).join(" · ")}</span>
                      </span>
                    </label>
                    <div className="flex items-center justify-between gap-5 pl-7 sm:pl-0">
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-700">{formatBytes(file.size)}</span>
                      <button onClick={() => toggleIgnored(file.id)} className="text-sm font-semibold text-slate-500 hover:text-teal-700">{ignored ? "Batal abaikan" : "Abaikan"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedIds.size > 0 && <p className="mt-4 text-sm font-medium text-slate-700">{selectedIds.size} file dipilih · {formatBytes(selectedBytes)}</p>}
          </section>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="delete-title" className="text-xl font-bold text-slate-950">Konfirmasi penghapusan</h2>
            <p className="mt-3 text-slate-700">Anda akan menghapus <strong>{selectedIds.size} file</strong> dengan total <strong>{formatBytes(selectedBytes)}</strong>.</p>
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">Penghapusan bersifat permanen dan mungkin tidak masuk Tempat Sampah. Pastikan file yang dipilih sudah benar.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Batal</button>
              <button onClick={deleteSelected} className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800">Ya, hapus file</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-950">{value}</p></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={active} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${active ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-teal-600"}`}>{children}</button>;
}
