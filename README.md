# ByteClean

ByteClean memindai folder pilihan pengguna di browser, menampilkan kandidat file yang dapat ditinjau, dan menghitung skor kebersihan digital. File tidak diunggah. Pengguna Chrome atau Edge desktop dapat memberi izin tulis dan menghapus file pilihan secara nyata. Browser lain dapat memindai, meninjau, dan mengekspor CSV melalui pemilih folder mode baca.

## Menjalankan

Gunakan Node.js 20.9+.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Pemindaian, demo, CSV, dan riwayat lokal bekerja tanpa Supabase. Demo sintetis tersedia di `/scan?demo=1` dan tidak dapat menghapus file atau masuk ke dasbor.

## Menghubungkan Supabase

1. Buat project Supabase. Salin `.env.example` menjadi `.env.local`, lalu isi URL project, **publishable/anon key** (jangan service role key), dan URL situs.
2. Jalankan isi `supabase/migrations/202611150001_byteclean.sql` pada SQL Editor Supabase, atau terapkan sebagai migrasi melalui Supabase CLI.
3. Di Supabase Authentication, atur Site URL sesuai `NEXT_PUBLIC_SITE_URL` dan tambahkan `<site-url>/auth/callback` ke Redirect URLs. Aktifkan email confirmation jika diinginkan.
4. Restart server pengembangan. Untuk Vercel, isi tiga variabel yang sama di pengaturan environment dan deploy ulang.

Tanpa konfigurasi ini, akun dan dasbor organisasi menampilkan status belum terhubung. Jangan memasukkan service role key ke variabel `NEXT_PUBLIC_`.

## Alur aplikasi

- **Masuk/daftar:** email dan kata sandi melalui Supabase Auth.
- **Organisasi:** pengguna membuat organisasi sebagai admin atau bergabung dengan kode undangan. Satu akun menjadi anggota satu organisasi.
- **Admin:** membuat/mencabut kode, mengatur ambang pindai, melihat jumlah anggota, jumlah pindai, rata-rata skor, potensi ruang, ruang yang dibebaskan, dan tren bulanan. Dasbor tidak menampilkan hasil per orang.
- **Pindai:** kategori duplikat terverifikasi, besar dan lama, sementara, installer lama, kosong, dan bernama salinan. Hasil ditinjau sebelum penghapusan. CSV mencakup daftar lokal yang dipilih atau kandidat yang belum diabaikan.
- **Riwayat:** angka ringkasan disimpan di IndexedDB. Saat pengguna masuk dan menjadi anggota organisasi, angka ringkasan disinkronkan ke Supabase. Nama, jalur, hash, dan isi file tidak disimpan di Supabase.

Penghapusan meminta izin tulis terpisah, memeriksa ulang ukuran dan waktu perubahan file, serta memerlukan konfirmasi. Penghapusan mungkin permanen dan tidak melewati Tempat Sampah. Gunakan folder uji untuk demo pertama.

## Verifikasi

```bash
npm test
npm run lint
npm run build
```

Skema SQL dan alur akun memerlukan project Supabase aktif untuk pengujian langsung. Tanpa kredensial, build dan uji lokal tidak membuktikan integrasi cloud.

Dokumen analisis awal ada di `docs/Analisis Spesifikasi ByteClean.docx`.
