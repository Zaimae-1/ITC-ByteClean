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
        <section className="border-b border-[#dce7e1] bg-[#f0f5ef]">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-14 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:py-20">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight text-[#243331] sm:text-5xl">
                Beri ruang untuk yang penting. <span className="text-[#2b6d62]">Bereskan file yang tak perlu.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#425b55]">
                ByteClean membantu menemukan file kembar dan file lama di folder pilihan Anda. Tinjau hasilnya, lindungi yang penting, lalu putuskan sendiri apa yang ingin dibersihkan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/scan" className="inline-flex min-h-12 items-center rounded-xl bg-[#2e7066] px-6 py-3 font-semibold text-white hover:bg-[#24594f]">Pindai folder sekarang</Link>
                <Link href="/scan?demo=1" className="inline-flex min-h-12 items-center px-2 py-3 font-semibold text-[#285e53] underline-offset-4 hover:underline">Coba demo tanpa pilih folder →</Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#425b55]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dcece2] text-[#285e53]" aria-hidden="true">✓</span> Isi, nama, dan jalur file tidak diunggah ke server.</p>
            </div>
            <DemoPreview />
          </div>
        </section>
        <section id="sdgs" className="border-y border-[#dce7e1] bg-[#f3f6f1]">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#826321]">Terinspirasi SDGs 12</p>
                <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-[#243331] sm:text-3xl">Bereskan folder. Biasakan menyimpan seperlunya.</h2>
              </div>
              <p className="leading-7 text-[#425b55]">Konsumsi dan produksi yang bertanggung jawab dimulai dari pilihan sehari-hari. Di ByteClean, Anda bisa mulai dengan meninjau data yang benar-benar masih diperlukan. <a href="https://sdgs.un.org/goals/goal12" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#285e53] underline underline-offset-4">Kenali SDGs 12<span className="sr-only"> (buka di tab baru)</span></a>.</p>
            </div>
            <p className="mt-10 text-sm font-semibold text-[#285e53]">Tiga langkah sederhana</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">{features.map((feature) => <div key={feature.number} className="rounded-2xl border border-[#dce7e1] bg-white p-6"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#eaf1ec] font-semibold text-[#285e53]">{feature.number}</span><h3 className="mt-5 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#425b55]">{feature.description}</p></div>)}</div>
            <p className="mt-7 max-w-3xl text-sm leading-6 text-[#526a63]">ByteClean saat ini hanya mengukur ruang lokal yang dibebaskan. Penghematan listrik atau emisi pusat data belum diukur.</p>
          </div>
        </section>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          <div><h2 className="text-lg font-semibold">Privasi sejak awal</h2><p className="mt-2 text-slate-600">File diperiksa di perangkatmu. Jika kamu memakai akun organisasi, hanya angka ringkasan yang dikirim.</p></div>
          <div><h2 className="text-lg font-semibold">Keputusan di tangan Anda</h2><p className="mt-2 text-slate-600">Tidak ada file yang tercentang otomatis. Setiap penghapusan memerlukan konfirmasi.</p></div>
          <div><h2 className="text-lg font-semibold">Mulai dari perangkat sendiri</h2><p className="mt-2 text-slate-600">Pindai folder lokal atau coba mode demo dengan data contoh tanpa meminta akses ke file perangkat.</p></div>
        </section>
      </main>
    </>
  );
}
