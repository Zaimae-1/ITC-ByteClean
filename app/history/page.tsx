import { HistoryList } from "./history-list";

export default function HistoryPage() {
  return (
    <>
      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Tersimpan di perangkat</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Riwayat pemindaian</h1>
        <p className="mt-4 max-w-2xl leading-7 text-slate-600">Riwayat di perangkat ini hanya berisi angka ringkasan dan aturan pindai. Nama dan isi file tidak disimpan di riwayat.</p>
        <HistoryList />
      </main>
    </>
  );
}
