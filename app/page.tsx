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
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#cbded2] bg-white px-4 py-2 text-sm font-semibold text-[#285e53]"><span className="size-2 rounded-full bg-[#438577]" /> Pembersihan file dengan kendali Anda</p>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight text-[#243331] sm:text-5xl">
                Folder lebih rapi. <span className="text-[#2b6d62]">Anda tetap memutuskan</span> apa yang dibersihkan.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#425b55]">
                Pindai folder pilihan Anda, lihat potensi ruang yang bisa dibebaskan, lalu tentukan sendiri file yang ingin dibersihkan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/scan" className="inline-flex min-h-12 items-center rounded-xl bg-[#2e7066] px-6 py-3 font-semibold text-white hover:bg-[#24594f]">Mulai pindai</Link>
                <Link href="/scan?demo=1" className="inline-flex min-h-12 items-center px-2 py-3 font-semibold text-[#285e53] underline-offset-4 hover:underline">Coba demo tanpa pilih folder →</Link>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-[#425b55]"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dcece2] text-[#285e53]" aria-hidden="true">✓</span> Isi, nama, dan jalur file tidak diunggah ke server.</p>
            </div>
            <DemoPreview />
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-5 pt-16"><p className="text-sm font-semibold text-[#285e53]">Tiga langkah sederhana</p><h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Dari folder penuh ke keputusan yang jelas</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{features.map((feature) => <div key={feature.number} className="rounded-2xl border border-[#dce7e1] bg-white p-6"><span className="inline-flex size-10 items-center justify-center rounded-xl bg-[#eaf1ec] font-semibold text-[#285e53]">{feature.number}</span><h3 className="mt-5 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[#425b55]">{feature.description}</p></div>)}</div></section>
        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3">
          <div><h2 className="text-lg font-semibold">Privasi sejak awal</h2><p className="mt-2 text-slate-600">File diperiksa di perangkatmu. Jika kamu memakai akun organisasi, hanya angka ringkasan yang dikirim.</p></div>
          <div><h2 className="text-lg font-semibold">Keputusan di tangan Anda</h2><p className="mt-2 text-slate-600">Tidak ada file yang tercentang otomatis. Setiap penghapusan memerlukan konfirmasi.</p></div>
          <div><h2 className="text-lg font-semibold">Dapat dipresentasikan</h2><p className="mt-2 text-slate-600">Mode demo memakai data contoh dan tidak meminta akses ke folder perangkat.</p></div>
        </section>
      </main>
    </>
  );
}
