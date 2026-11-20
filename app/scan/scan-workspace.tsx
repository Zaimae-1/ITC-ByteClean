"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { syncScanRecord } from "@/lib/supabase/sync";
import { createDemoFiles } from "@/lib/scanner/demo";
import { filesToCsv } from "@/lib/scanner/csv";
import { deleteSelectedFiles } from "@/lib/scanner/delete";
import {
  calculateSummary,
  duplicateKeeperIds,
  formatBytes,
  potentialFileIds,
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
import { groupByZone, zoneForFile, ZONE_LABELS, type Zone } from "@/lib/scanner/zones";
import { scheduleYellowReview } from "@/lib/scanner/reminder";

type Phase = "idle" | "collecting" | "hashing" | "complete" | "deleting";
type Filter = Category | "all";
type Sort = "largest" | "smallest" | "oldest" | "name";
const DEMO_SCAN_TIME = Date.UTC(2026, 10, 16);

const CATEGORY_COLORS: Record<Category, string> = {
  duplicate: "bg-indigo-500",
  largeOld: "bg-orange-500",
  temporary: "bg-sky-500",
  oldInstaller: "bg-violet-500",
  empty: "bg-slate-500",
  namedCopy: "bg-teal-500",
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
  const [unreadableHashCount, setUnreadableHashCount] = useState(0);
  const [hashProgress, setHashProgress] = useState({ done: 0, total: 0 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [keeperIds, setKeeperIds] = useState<Set<string>>(() => initialDemo ? duplicateKeeperIds(createDemoFiles()) : new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [zoneFilter, setZoneFilter] = useState<Zone | "all">(initialDemo ? "green" : "all");
  const [scannedAt, setScannedAt] = useState(initialDemo ? DEMO_SCAN_TIME : 0);
  const [sort, setSort] = useState<Sort>("largest");
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

  const protectedIds = useMemo(() => new Set([...ignoredIds, ...keeperIds]), [ignoredIds, keeperIds]);
  const summary = useMemo(() => calculateSummary(files, protectedIds), [files, protectedIds]);
  const candidateIds = useMemo(() => potentialFileIds(files, protectedIds), [files, protectedIds]);
  const zones = useMemo(() => groupByZone(files, candidateIds, scannedAt), [files, candidateIds, scannedAt]);
  const selectedFiles = useMemo(
    () => files.filter((file) => selectedIds.has(file.id)),
    [files, selectedIds],
  );
  const selectedBytes = selectedFiles.reduce((total, file) => total + file.size, 0);
  const visibleFiles = useMemo(
    () => files.filter((file) =>
      (zoneFilter === "all" || zoneForFile(file, candidateIds, scannedAt) === zoneFilter) &&
      (filter === "all" || file.categories.includes(filter)) &&
      (search === "" || file.path.toLocaleLowerCase("id-ID").includes(search.toLocaleLowerCase("id-ID"))),
    ).sort((a, b) => {
      if (sort === "largest") return b.size - a.size || a.path.localeCompare(b.path);
      if (sort === "smallest") return a.size - b.size || a.path.localeCompare(b.path);
      if (sort === "oldest") return a.lastModified - b.lastModified || a.path.localeCompare(b.path);
      return a.path.localeCompare(b.path, "id-ID");
    }),
    [files, filter, search, zoneFilter, candidateIds, scannedAt, sort],
  );
  const hasResults = phase === "complete" || phase === "deleting";
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const isSupportedDeleteBrowser = typeof navigator !== "undefined" && /(?:Chrome|Edg)\//.test(navigator.userAgent) && !/(?:OPR|CriOS|SamsungBrowser)\//.test(navigator.userAgent);
  const canDelete = !demo && !readOnly && !isMobile && isSupportedDeleteBrowser && rootHandle !== null;
  const canSelect = demo || canDelete;
  const hasExportableFiles = candidateIds.size > 0;

  function startWorker(source: ScanSource, folderName: string, handle: FileSystemDirectoryHandle | null) {
    workerRef.current?.terminate();
    setFiles([]);
    setSelectedIds(new Set());
    setIgnoredIds(new Set());
    setKeeperIds(new Set());
    setFilter("all");
    setZoneFilter("all");
    setSearch("");
    setDemo(false);
    setSourceName(folderName);
    setRootHandle(handle);
    setReadOnly(handle === null);
    setPhase("collecting");
    setScannedCount(0);
    setSkippedCount(0);
    setUnreadableHashCount(0);
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
        const completedAt = Date.now();
        setFiles(response.files);
        const keepers = duplicateKeeperIds(response.files);
        setKeeperIds(keepers);
        setScannedAt(completedAt);
        const freshZones = groupByZone(response.files, potentialFileIds(response.files, keepers), completedAt);
        setZoneFilter(freshZones.green.length ? "green" : freshZones.yellow.length ? "yellow" : "red");
        if (freshZones.yellow.length > 0) scheduleYellowReview(completedAt);
        setSkippedCount(response.skippedFiles);
        setUnreadableHashCount(response.unreadableHashes);
        setPhase("complete");
        setMessage(`Pemindaian selesai. ${response.files.length.toLocaleString("id-ID")} file diperiksa.`);
        const record = {
          clientId: crypto.randomUUID(),
          createdAt: Date.now(),
          summary: calculateSummary(response.files, keepers),
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
    setKeeperIds(duplicateKeeperIds(createDemoFiles()));
    setFilter("all");
    setZoneFilter("green");
    setScannedAt(DEMO_SCAN_TIME);
    setSearch("");
    setDeletedBytes(0);
    setDeletedCount(0);
    setUnreadableHashCount(0);
    scanRecordPromiseRef.current = null;
    setError("");
    setMessage("Mode demo aktif. Data ini sintetis dan tidak berasal dari perangkat Anda.");
  }

  function toggleSelection(id: string) {
    const target = files.find((file) => file.id === id);
    if (!target || zoneForFile(target, candidateIds, scannedAt) === "red") {
      setError("File yang dilindungi tidak bisa dipilih untuk dihapus.");
      return;
    }
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

  function exploreCategory(category: Category) {
    setZoneFilter("all");
    setFilter(category);
    setSelectedIds(new Set());
    document.getElementById("scan-results")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function exploreZone(zone: Zone) {
    setZoneFilter(zone);
    setFilter("all");
    setSelectedIds(new Set());
    document.getElementById("scan-results")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  function reviewGreenZone() {
    const ids = new Set(zones.green.map((file) => file.id));
    if (ids.size === 0 || !canSelect) return;
    const invalid = validateDeletionSelection(files, ids);
    if (invalid) { setError(invalid); return; }
    setZoneFilter("green");
    setFilter("all");
    setSelectedIds(ids);
    setShowConfirm(true);
  }

  function exportCsv() {
    const exportFiles = selectedFiles.length
      ? selectedFiles
      : files.filter((file) => candidateIds.has(file.id));
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
    if (selectedIds.size === 0) return;
    if (selectedFiles.some((file) => zoneForFile(file, candidateIds, scannedAt) === "red")) {
      setError("File yang dilindungi tidak bisa dihapus.");
      return;
    }
    if (demo && !invalid) {
      const chosen = new Set(selectedIds);
      setFiles((current) => current.filter((file) => !chosen.has(file.id)));
      setSelectedIds(new Set());
      setZoneFilter("yellow");
      setFilter("all");
      setDeletedBytes((current) => current + selectedBytes);
      setDeletedCount((current) => current + chosen.size);
      setMessage(`Simulasi selesai: ${chosen.size} file contoh dibersihkan dan ${formatBytes(selectedBytes)} ruang contoh dibebaskan. Tidak ada file perangkat yang berubah.`);
      return;
    }
    if (invalid || !rootHandle || readOnly || demo) {
      setError(invalid ?? "Penghapusan tidak tersedia untuk hasil ini.");
      return;
    }
    setError("");
    setPhase("deleting");
    let result: Awaited<ReturnType<typeof deleteSelectedFiles>>;
    try {
      result = await deleteSelectedFiles(rootHandle, selectedFiles, files);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Browser tidak dapat meminta izin tulis untuk folder ini.");
      setPhase("complete");
      return;
    }
    const { deleted, failures, bytes } = result;
    setFiles((current) => current.filter((file) => !deleted.has(file.id)));
    setSelectedIds(new Set());
    if (zones.green.length > 0 && zones.green.every((file) => deleted.has(file.id))) {
      setZoneFilter("yellow");
      setFilter("all");
    }
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
          <p className="text-sm font-semibold text-[#285e53]">Pemindaian lokal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#243331] sm:text-4xl">Pindai folder Anda</h1>
          <p className="mt-3 max-w-2xl text-[#425b55]">File diperiksa di perangkatmu. Nama dan isi file tidak dikirim ke server.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input ref={inputRef} type="file" multiple onChange={chooseFallback} className="sr-only" aria-label="Pilih folder" />
          <button onClick={pickFolder} disabled={phase === "collecting" || phase === "hashing" || phase === "deleting"} className="rounded-xl bg-[#2e7066] px-5 py-3 font-semibold text-white hover:bg-[#24594f] disabled:opacity-50">
            {hasResults ? "Pilih folder lain" : "Pilih folder"}
          </button>
          <button onClick={loadDemo} disabled={phase === "deleting"} className="px-2 py-3 font-semibold text-teal-700 underline-offset-4 hover:underline disabled:opacity-50">{demo ? "Ulangi demo" : "Coba demo"}</button>
        </div>
      </div>
      <details className="mt-4 text-sm text-slate-600"><summary className="cursor-pointer font-semibold text-teal-700">Pilihan untuk browser lain</summary><p className="mt-2 max-w-2xl">Jika pilihan folder biasa tidak tersedia, gunakan mode baca saja. Kamu tetap bisa melihat hasil dan mengunduh daftar file.</p><button onClick={pickReadOnlyFolder} disabled={phase === "collecting" || phase === "hashing" || phase === "deleting"} className="mt-2 font-semibold text-teal-700 underline underline-offset-4 disabled:opacity-50">Pilih folder mode baca saja</button></details>

      {demo && <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-900">Mode demo: semua file dan angka di sini hanya contoh. Kamu bisa mencoba memilih dan membersihkan file contoh tanpa mengubah file perangkat.</div>}
      {!canDelete && hasResults && !demo && <div className="mt-7 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">Mode baca saja: kamu bisa melihat hasil dan mengunduh daftar, tetapi browser ini tidak bisa menghapus file dari folder tersebut.</div>}
      {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className={`mt-5 rounded-xl px-4 py-3 font-medium ${deletedCount > 0 ? "bg-teal-700 text-white" : "border border-teal-200 bg-teal-50 text-teal-900"}`}>{deletedCount > 0 && <span aria-hidden="true">✓ </span>}{message}</p>}

      {(phase === "collecting" || phase === "hashing") && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6" aria-live="polite">
          <p className="font-semibold text-slate-900">{phase === "collecting" ? "Membaca folder..." : "Memeriksa file kembar..."}</p>
          <p className="mt-1 text-slate-600">{scannedCount.toLocaleString("id-ID")} file dibaca{skippedCount ? `; ${skippedCount} dilewati` : ""}{phase === "hashing" && hashProgress.total > 0 ? ` · ${Math.min(100, Math.round(hashProgress.done / hashProgress.total * 100))}% pemeriksaan kembar` : ""}.</p>
          {phase === "hashing" && hashProgress.total > 0 && (
            <progress className="mt-4 w-full accent-teal-700" value={hashProgress.done} max={hashProgress.total} aria-label="Kemajuan pemeriksaan file kembar" />
          )}
          {phase === "collecting" && <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="scan-progress-indeterminate h-full w-1/3 rounded-full bg-teal-600" /></div>}
          <button onClick={cancelScan} className="mt-5 text-sm font-semibold text-red-700 hover:underline">Batal</button>
        </section>
      )}

      {hasResults && (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Folder: <strong className="text-slate-900">{sourceName}</strong>{skippedCount ? ` · ${skippedCount} file atau folder tidak dapat dibaca` : ""}{unreadableHashCount ? ` · ${unreadableHashCount} file tidak dapat diperiksa sebagai duplikat` : ""}</p>
            <Link href="/score" className="text-sm font-semibold text-teal-700 hover:underline">Bagaimana skor dihitung?</Link>
          </div>
          <section aria-label="Ringkasan pemindaian" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.35fr]">
            <SummaryCard label="File diperiksa" value={summary.totalFiles.toLocaleString("id-ID")} detail="Dalam folder pilihan" />
            <SummaryCard label="Ukuran terpindai" value={formatBytes(summary.totalBytes)} detail="Dianalisis di perangkat" />
            <SummaryCard label="Potensi ruang" value={formatBytes(summary.potentialBytes)} detail={`${summary.potentialFiles.toLocaleString("id-ID")} file perlu ditinjau`} />
            <div className="flex items-center gap-4 rounded-2xl border border-[#d5e2da] bg-[#eef5ef] p-5 text-[#243331]">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full p-2" style={{ background: `conic-gradient(#438577 ${(summary.score ?? 0) * 3.6}deg, #d8e5db 0)` }}>
                <div key={summary.score ?? "none"} className="score-pop flex size-full items-center justify-center rounded-full bg-[#eef5ef] text-xl font-bold">{summary.score ?? "—"}</div>
              </div>
              <div><p className="text-sm text-[#425b55]">Skor kebersihan</p><p className="mt-1 font-semibold">{summary.score === null ? "Belum tersedia" : `${summary.score} dari 100`}</p><p className="mt-1 text-xs text-[#526a63]">Berdasarkan ruang yang perlu ditinjau</p></div>
            </div>
          </section>
          {deletedBytes > 0 && <p className="mt-4 text-sm font-semibold text-teal-800">Berhasil dibebaskan dalam sesi ini: {formatBytes(deletedBytes)}</p>}

          <section className="mt-8" aria-label="Tiga zona file">
            <div><p className="text-sm font-semibold text-[#285e53]">Langkah berikutnya</p><h2 className="mt-1 text-2xl font-bold">Pilih zona yang ingin ditangani</h2><p className="mt-2 text-[#425b55]">Baca petunjuk di setiap zona sebelum memilih file. Warna membantu membedakan tindakan.</p></div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <ZoneCard zone="green" count={zones.green.length} bytes={zones.green.reduce((total, file) => total + file.size, 0)} active={zoneFilter === "green"} onExplore={() => exploreZone("green")} onBulk={canSelect ? reviewGreenZone : undefined} demo={demo} />
              <ZoneCard zone="yellow" count={zones.yellow.length} bytes={zones.yellow.reduce((total, file) => total + file.size, 0)} active={zoneFilter === "yellow"} onExplore={() => exploreZone("yellow")} />
              <ZoneCard zone="red" count={zones.red.length} bytes={zones.red.reduce((total, file) => total + file.size, 0)} active={zoneFilter === "red"} onExplore={() => exploreZone("red")} />
            </div>
            <p className="mt-3 text-sm text-[#526a63]">Hijau: dapat ditinjau bersama · Kuning: periksa satu per satu · Merah: dilindungi</p>
          </section>

          <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <summary className="cursor-pointer font-semibold text-teal-800">Lihat grafik menurut jenis file</summary>
            <p className="mt-2 text-sm text-slate-500">Satu file dapat muncul di beberapa jenis.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => {
                const item = summary.categories[category];
                const max = Math.max(...CATEGORIES.map((key) => summary.categories[key].bytes), 1);
                return <button key={category} onClick={() => exploreCategory(category)} className="group rounded-xl border border-[#dce7e1] p-4 text-left transition hover:border-[#438577] hover:bg-[#f8faf8]" aria-label={`Lihat ${CATEGORY_LABELS[category]}, ${item.count} file`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold text-slate-900">{CATEGORY_LABELS[category]}</span><span className="text-sm font-bold text-slate-600 group-hover:text-teal-700">{item.count} file ↗</span></div>
                  <p className="mt-2 text-sm text-slate-500">{formatBytes(item.bytes)}</p>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${CATEGORY_COLORS[category]} transition-all duration-300`} style={{ width: `${item.bytes === 0 ? 0 : Math.max(5, item.bytes / max * 100)}%` }} /></div>
                </button>;
              })}
            </div>
          </details>

          <section id="scan-results" className="mt-10 scroll-mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Hasil dan tinjauan</h2>
                <p className="mt-1 text-slate-600">Tidak ada file yang terpilih otomatis. Periksa satu per satu sebelum menghapus.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={exportCsv} disabled={!hasExportableFiles && selectedFiles.length === 0} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:border-teal-600 disabled:opacity-50">Unduh daftar file</button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3"><p className="font-semibold text-slate-700">{zoneFilter === "all" ? "Semua zona" : ZONE_LABELS[zoneFilter]}</p>{zoneFilter !== "all" && <button onClick={() => { setZoneFilter("all"); setFilter("all"); setSelectedIds(new Set()); }} className="text-sm font-semibold text-teal-700 hover:underline">Lihat semua zona</button>}</div>
            <details className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3"><summary className="cursor-pointer text-sm font-semibold text-teal-800">Filter lanjut menurut jenis file</summary><div className="mt-4 flex flex-wrap gap-2"><FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Semua jenis</FilterButton>{CATEGORIES.map((category) => <FilterButton key={category} active={filter === category} onClick={() => setFilter(category)}>{CATEGORY_LABELS[category]} <span className="opacity-70">{summary.categories[category].count}</span></FilterButton>)}</div></details>
            <div className="mt-5 flex flex-wrap items-end gap-4 rounded-2xl bg-slate-50 p-4">
              <label className="min-w-52 flex-1"><span className="mb-1 block text-xs font-semibold text-slate-600">Cari dalam hasil</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau jalur file" className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600" /></label>
              <label className="min-w-44"><span className="mb-1 block text-xs font-semibold text-slate-600">Urutkan</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600"><option value="largest">Terbesar dulu</option><option value="smallest">Terkecil dulu</option><option value="oldest">Terlama dulu</option><option value="name">Nama A–Z</option></select></label>
              {(search || filter !== "all") && <button onClick={() => { setSearch(""); setFilter("all"); }} className="px-2 py-3 text-sm font-semibold text-teal-700 hover:underline">Reset filter</button>}
            </div>
            <p className="mt-3 text-sm text-slate-500">{visibleFiles.length.toLocaleString("id-ID")} file dalam tampilan{visibleFiles.length > 200 ? " · tampil 200 pertama, gunakan pencarian untuk mempersempit" : ""}.</p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {visibleFiles.length === 0 && <p className="px-5 py-9 text-center text-slate-500">Tidak ada file pada kategori ini.</p>}
              {visibleFiles.slice(0, 200).map((file) => {
                const ignored = ignoredIds.has(file.id);
                const zone = zoneForFile(file, candidateIds, scannedAt);
                return (
                  <div key={file.id} className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:flex-row sm:items-center">
                    <label className="flex min-w-0 flex-1 items-start gap-3">
                      <input type="checkbox" checked={selectedIds.has(file.id)} disabled={zone === "red" || !canSelect} onChange={() => toggleSelection(file.id)} className="mt-1 size-5 shrink-0 accent-[#2e7066] disabled:opacity-50" aria-label={`Pilih ${file.path}`} />
                      <span className="min-w-0">
                        <span className="block break-all font-medium text-slate-900">{file.name}</span>
                        <span className="block break-all text-xs text-slate-500">{file.path}</span>
                        <span className="mt-1 block text-xs text-slate-600">{file.categories.map((category) => CATEGORY_LABELS[category]).join(" · ")}</span>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${zone === "green" ? "bg-emerald-100 text-emerald-900" : zone === "yellow" ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-900"}`}>{ZONE_LABELS[zone]}</span>
                      </span>
                    </label>
                    <div className="flex items-center justify-between gap-5 pl-7 sm:pl-0">
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-700">{formatBytes(file.size)}</span>
                      {!keeperIds.has(file.id) && (ignored || zone !== "red") && <button onClick={() => toggleIgnored(file.id)} className="text-sm font-semibold text-slate-500 hover:text-teal-700">{ignored ? "Batal lindungi" : "Lindungi"}</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedIds.size > 0 && <div className="sticky bottom-4 z-30 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#bfd7ca] bg-[#eaf3ec] px-5 py-4 text-[#243331] shadow-lg shadow-[#779487]/15" role="status"><div><p className="text-sm text-[#425b55]">{selectedIds.size} file dipilih</p><p className="text-lg font-bold sm:text-xl">Ruang dari pilihan: {formatBytes(selectedBytes)}</p></div><div className="flex flex-wrap items-center gap-3"><button onClick={() => setSelectedIds(new Set())} className="px-2 font-semibold text-[#285e53] hover:underline">Batal pilih</button><button onClick={demo ? deleteSelected : () => setShowConfirm(true)} disabled={phase === "deleting"} className="rounded-xl bg-[#2e7066] px-4 py-3 font-bold text-white hover:bg-[#24594f] disabled:opacity-50">{demo ? "Simulasikan bersih-bersih" : "Hapus yang dicentang"}</button></div></div>}
          </section>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="delete-title" className="text-xl font-bold text-slate-950">{demo ? "Konfirmasi simulasi" : "Konfirmasi penghapusan"}</h2>
            <p className="mt-3 text-slate-700">{demo ? "Kamu akan membersihkan" : "Kamu akan menghapus"} <strong>{selectedIds.size} file</strong> dengan total <strong>{formatBytes(selectedBytes)}</strong>.</p>
            <p className={`mt-3 rounded-lg p-3 font-medium ${demo ? "bg-amber-50 text-amber-900" : "bg-red-50 text-red-800"}`}>{demo ? "Ini hanya data contoh. Tidak ada file perangkat yang berubah." : "File mungkin terhapus permanen dan tidak masuk Tempat Sampah. Periksa lagi pilihanmu."}</p>
            <p className="mt-3 text-sm text-slate-600">{selectedFiles.slice(0, 3).map((file) => file.name).join(", ")}{selectedFiles.length > 3 ? `, dan ${selectedFiles.length - 3} lainnya` : ""}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold">Batal</button>
              <button onClick={deleteSelected} className={`rounded-lg px-4 py-2 font-semibold text-white ${demo ? "bg-teal-700 hover:bg-teal-800" : "bg-red-700 hover:bg-red-800"}`}>{demo ? "Ya, bersihkan contoh" : "Ya, hapus file"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-[#dce7e1] bg-white p-5"><p className="text-sm text-[#526a63]">{label}</p><p className="mt-2 text-2xl font-bold text-[#243331]">{value}</p><p className="mt-2 text-xs text-[#526a63]">{detail}</p></div>;
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} aria-pressed={active} className={`rounded-full border px-4 py-2 text-sm font-semibold ${active ? "border-[#2e7066] bg-[#2e7066] text-white" : "border-[#cbd9d0] bg-white text-[#425b55] hover:border-[#438577] hover:bg-[#f0f5ef]"}`}>{children}</button>;
}

function ZoneCard({ zone, count, bytes, active, onExplore, onBulk, demo }: {
  zone: Zone;
  count: number;
  bytes: number;
  active: boolean;
  onExplore: () => void;
  onBulk?: () => void;
  demo?: boolean;
}) {
  const colors = {
    green: "border-[#d5e7d9] bg-[#f0f7f0] text-[#244b35]",
    yellow: "border-[#e8dfc9] bg-[#faf7ed] text-[#594d30]",
    red: "border-[#e8dada] bg-[#faf3f2] text-[#624744]",
  };
  const dot = { green: "bg-[#4a8061]", yellow: "bg-[#a5823f]", red: "bg-[#a66b65]" };
  const action = { green: "Bisa ditinjau bersama", yellow: "Periksa satu per satu", red: "Tidak bisa dihapus" };
  const description = {
    green: "Salinan kembar tambahan dan file sementara lama. Tetap periksa jika ragu.",
    yellow: "Mungkin masih dipakai. Pilih file satu per satu sebelum menghapus.",
    red: "File tanpa temuan atau yang kamu lindungi pada sesi ini. Tidak bisa dihapus di sini.",
  };
  return <div className={`rounded-2xl border p-5 ${colors[zone]} ${active ? "ring-2 ring-[#438577] ring-offset-2" : ""}`}>
    <div className="flex items-center gap-2"><span className={`size-3 rounded-full ${dot[zone]}`} /><h3 className="text-xl font-bold">{ZONE_LABELS[zone]}</h3></div>
    <p className="mt-2 text-sm font-bold">{action[zone]}</p>
    <p className="mt-4 text-2xl font-bold">{count.toLocaleString("id-ID")} file <span className="text-base font-medium">· {formatBytes(bytes)}</span></p>
    <p className="mt-3 min-h-16 leading-6">{description[zone]}</p>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={onExplore} className="rounded-lg border border-current px-4 py-2 font-semibold hover:bg-white/60">Lihat file</button>{zone === "green" && onBulk && count > 0 && <button onClick={onBulk} className="rounded-lg bg-[#2e7066] px-4 py-2 font-semibold text-white hover:bg-[#24594f]">{demo ? "Simulasi bersihkan semua" : "Bersihkan semua"}</button>}</div>
  </div>;
}
