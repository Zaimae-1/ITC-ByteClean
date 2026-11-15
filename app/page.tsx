import Link from "next/link";
import { SiteHeader } from "./components/site-header";

const features = [
  { number: "01", title: "Pilih folder", description: "Anda menentukan folder yang boleh dibaca. ByteClean tidak memindai seluruh komputer tanpa izin." },
  { number: "02", title: "Tinjau hasil", description: "Lihat duplikat, file besar dan lama, file sementara, installer lama, file kosong, dan nama salinan." },
  { number: "03", title: "Bersihkan sendiri", description: "Pilih file secara manual. Hapus di Chrome atau Edge desktop, atau ekspor daftar ke CSV." },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-slate-200 bg-gradient-to-br from-teal-50 via-white to-sky-50">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
            <div>
              <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-teal-700">Ruang kerja lebih rapi</p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
                Temukan file yang memenuhi penyimpanan.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Pindai folder pilihan Anda, lihat potensi ruang yang bisa dibebaskan, lalu tentukan sendiri file yang ingin dibersihkan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/scan" className="rounded-xl bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800">Mulai pindai</Link>
                <Link href="/scan?demo=1" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 hover:border-teal-600">Coba demo</Link>
              </div>
              <p className="mt-6 text-sm text-slate-600">Isi, nama, dan jalur file tidak diunggah ke server.</p>
            </div>
            <div className="rounded-3xl border border-teal-100 bg-white p-7 shadow-xl shadow-teal-950/5">
              <p className="text-sm font-bold uppercase tracking-widest text-teal-700">Cara kerja ByteClean</p>
              <div className="mt-7 space-y-6">
                {features.map((feature) => (
                  <div key={feature.number} className="flex gap-4">
                    <span className="font-mono text-xl font-bold text-teal-600">{feature.number}</span>
                    <div>
                      <h2 className="font-semibold text-slate-950">{feature.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          <div><h2 className="text-lg font-semibold">Privasi sejak awal</h2><p className="mt-2 text-slate-600">Analisis file berjalan di browser. Akun instansi hanya menerima angka ringkasan jika fitur sinkronisasi diaktifkan.</p></div>
          <div><h2 className="text-lg font-semibold">Keputusan di tangan Anda</h2><p className="mt-2 text-slate-600">Tidak ada file yang tercentang otomatis. Setiap penghapusan memerlukan konfirmasi.</p></div>
          <div><h2 className="text-lg font-semibold">Dapat dipresentasikan</h2><p className="mt-2 text-slate-600">Mode demo memakai data contoh dan tidak meminta akses ke folder perangkat.</p></div>
        </section>
      </main>
    </>
  );
}
