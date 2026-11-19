import Link from "next/link";

export default function ScorePage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <p className="text-sm font-semibold text-[#285e53]">Metode terbuka</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Tentang Skor Kebersihan Digital</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">Skor membantu memperkirakan porsi ruang yang mungkin dapat dibersihkan pada folder yang Anda pilih. Skor bukan penilaian keamanan atau kualitas file.</p>
        <section className="mt-9 rounded-2xl border border-[#d5e2da] bg-[#eef5ef] p-6">
          <h2 className="font-semibold text-teal-950">Rumus versi 1</h2>
          <p className="mt-2 break-words text-lg font-bold text-[#243331] sm:text-xl">100 × (1 − ukuran file yang perlu ditinjau ÷ ukuran semua file)</p>
          <p className="mt-3 leading-7 text-teal-900">Semakin sedikit ruang yang mungkin bisa dibersihkan, semakin tinggi skornya. File kembar selalu menyisakan setidaknya satu salinan. Satu file yang masuk beberapa kategori hanya dihitung sekali.</p>
        </section>
        <div className="mt-10 space-y-8">
          <section><h2 className="text-xl font-semibold">File apa yang perlu ditinjau?</h2><p className="mt-2 leading-7 text-slate-600">File kembar, file besar yang lama, file sementara, file pemasangan lama, file kosong, atau nama yang mirip salinan. Ini hanya petunjuk. File penting bisa masuk daftar, jadi periksa sebelum menghapus.</p></section>
          <section><h2 className="text-xl font-semibold">Kapan skor tidak sebanding?</h2><p className="mt-2 leading-7 text-slate-600">Folder yang berbeda atau aturan pindai yang berubah akan menghasilkan skor yang berbeda. Riwayat menyimpan aturan yang digunakan saat memindai.</p></section>
          <section><h2 className="text-xl font-semibold">Potensi berbeda dari hasil nyata</h2><p className="mt-2 leading-7 text-slate-600">Potensi ruang adalah perkiraan sebelum tindakan. Ruang berhasil dibebaskan hanya dihitung setelah browser melaporkan penghapusan yang berhasil.</p></section>
          <section><h2 className="text-xl font-semibold">Apa hubungannya dengan lingkungan?</h2><p className="mt-2 leading-7 text-slate-600">ByteClean membantu mengurangi file lokal yang tidak diperlukan dan mendorong kebiasaan menyimpan data secara sadar. Ruang lokal yang dibebaskan tidak otomatis mengurangi penggunaan listrik pusat data. Karena itu, kami tidak mengubah ukuran file yang dihapus menjadi angka penghematan energi atau emisi.</p></section>
        </div>
        <Link href="/scan" className="mt-10 inline-block rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800">Mulai pindai</Link>
      </main>
    </>
  );
}
