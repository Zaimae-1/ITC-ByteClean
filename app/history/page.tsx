import { SiteHeader } from "../components/site-header";
import { HistoryList } from "./history-list";

export default function HistoryPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Tersimpan di perangkat</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Riwayat pemindaian</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">Riwayat lokal hanya berisi angka ringkasan dan ambang yang dipakai. Nama, jalur, hash, dan isi file tidak disimpan di sini.</p>
        <HistoryList />
      </main>
    </>
  );
}
