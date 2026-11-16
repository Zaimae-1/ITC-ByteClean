import Link from "next/link";
import { DemoPreview } from "./components/demo-preview";

const features = [
  { number: "01", title: "Pilih folder", description: "Anda menentukan folder yang boleh dibaca. ByteClean tidak memindai seluruh komputer tanpa izin." },
  { number: "02", title: "Tinjau hasil", description: "Lihat file kembar, file besar yang lama, dan file lain yang mungkin tidak diperlukan." },
  { number: "03", title: "Bersihkan sendiri", description: "Pilih file yang ingin dibersihkan. Hapus di Chrome atau Edge desktop, atau unduh daftarnya." },
];

export default function Home() {
  return (
    <>
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-teal-50 via-white to-sky-50">
          <div className="pointer-events-none absolute -left-36 top-20 size-80 rounded-full bg-teal-200/40 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-sky-200/40 blur-3xl" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:py-24">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-teal-800"><span className="size-2 rounded-full bg-teal-500" /> Pembersihan file, kendali Anda</p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
                Temukan ruang. <span className="text-teal-700">Tentukan sendiri</span> yang dibersihkan.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Pindai folder pilihan Anda, lihat potensi ruang yang bisa dibebaskan, lalu tentukan sendiri file yang ingin dibersihkan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/scan" className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800">Mulai pindai</Link>
                <Link href="/scan?demo=1" className="self-center px-2 py-3 font-semibold text-teal-800 underline-offset-4 hover:underline">Coba demo tanpa pilih folder →</Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-slate-600"><span className="flex size-6 items-center justify-center rounded-full bg-teal-100 text-teal-800" aria-hidden="true">✓</span> Isi, nama, dan jalur file tidak diunggah ke server.</p>
            </div>
            <DemoPreview />
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 pt-16"><p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Tiga langkah sederhana</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Dari folder penuh ke keputusan yang jelas</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{features.map((feature) => <div key={feature.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-teal-50 font-mono font-bold text-teal-700">{feature.number}</span><h3 className="mt-5 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p></div>)}</div></section>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          <div><h2 className="text-lg font-semibold">Privasi sejak awal</h2><p className="mt-2 text-slate-600">File diperiksa di perangkatmu. Jika kamu memakai akun organisasi, hanya angka ringkasan yang dikirim.</p></div>
          <div><h2 className="text-lg font-semibold">Keputusan di tangan Anda</h2><p className="mt-2 text-slate-600">Tidak ada file yang tercentang otomatis. Setiap penghapusan memerlukan konfirmasi.</p></div>
          <div><h2 className="text-lg font-semibold">Dapat dipresentasikan</h2><p className="mt-2 text-slate-600">Mode demo memakai data contoh dan tidak meminta akses ke folder perangkat.</p></div>
        </section>
      </main>
    </>
  );
}
