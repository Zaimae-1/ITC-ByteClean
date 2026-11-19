# Naskah Video Demo ByteClean

**Durasi sasaran:** sekitar 3–4 menit  
**Format:** rekam layar desktop, 16:9, dengan narasi bahasa Indonesia.  
**Bahan gambar:** sepuluh JPEG bernomor `01` sampai `10` di folder ini. Angka pada mode demo adalah data contoh. Gambar riwayat tidak disertakan karena isi riwayat bergantung pada pemindaian lokal di browser perekam.

| Waktu | Tampilan dan tindakan | Narasi yang dibacakan |
|---|---|---|
| 00:00–00:18 | Beranda (`01-beranda.jpg`). Arahkan kursor ke **Coba demo tanpa pilih folder**. | “Pernah merasa penyimpanan penuh, tetapi takut menghapus file yang ternyata penting? ByteClean membantu menemukan file yang perlu ditinjau. Pengguna tetap memutuskan apa yang akan dibersihkan.” |
| 00:18–00:33 | Klik **Coba demo tanpa pilih folder**. Tampilkan label **Mode demo**. | “Untuk mencoba tanpa memberi akses ke folder, kita masuk ke mode demo. Semua file dan ukuran yang tampil di sini adalah contoh. Simulasi ini tidak mengubah file di perangkat.” |
| 00:33–00:55 | Ringkasan pindai (`02-hasil-pindai.jpg`). Sorot jumlah file, ukuran, potensi ruang, dan skor. | “Setelah pemindaian, ByteClean menampilkan jumlah file yang diperiksa, ukuran total, perkiraan ruang yang mungkin bisa dibebaskan, dan skor kebersihan. Potensi ruang adalah perkiraan; itu belum berarti ruang tersebut sudah benar-benar kosong.” |
| 00:55–01:20 | Gulir ke tiga zona (`03-tiga-zona.jpg`). Sorot tiap kartu. | “Hasil dibagi menjadi tiga zona. Hijau berisi kandidat pembersihan cepat, seperti salinan kembar tambahan atau file sementara lama. Kuning perlu diperiksa satu per satu karena mungkin masih dipakai. Merah berisi file yang dilindungi dan tidak dapat dihapus melalui ByteClean. Tetap baca nama serta konteks file sebelum bertindak.” |
| 01:20–01:43 | Buka **Lihat grafik menurut jenis file** (`04-enam-jenis-temuan.jpg`). | “Temuan juga dikelompokkan menjadi enam jenis: file kembar, file besar dan lama, file sementara, file pemasangan lama, file kosong, serta nama yang mirip salinan. Satu file bisa masuk lebih dari satu jenis, tetapi potensi ruangnya tidak dihitung ganda.” |
| 01:43–02:05 | Tampilkan daftar (`05-daftar-dan-filter.jpg`), lalu zona kuning (`09-periksa-dulu.jpg`) dan hasil **Lindungi** (`10-file-dilindungi.jpg`). | “Di daftar hasil, pengguna dapat mencari nama atau jalur file, mengurutkan hasil, memakai filter, serta mengunduh daftar sebagai CSV. Zona kuning diperiksa satu per satu. Tombol Lindungi memindahkan pilihan ke zona terlindungi pada sesi ini. Tidak ada file yang tercentang otomatis.” |
| 02:05–02:25 | Centang satu file contoh (`06-pilihan-pembersihan.jpg`). | “Saat sebuah file dipilih, ByteClean langsung menampilkan jumlah file dan total ruang dari pilihan. Zona hijau juga punya pilihan untuk meninjau seluruh kandidat sekaligus, sedangkan zona kuning dipilih satu per satu.” |
| 02:25–02:46 | Klik **Simulasikan bersih-bersih**, lalu tampilkan hasil (`07-hasil-simulasi.jpg`). | “Sekarang saya jalankan simulasi. Satu file contoh dibersihkan, sehingga angka potensi dan skor berubah. Perhatikan: ini hanya perubahan pada data contoh. Tidak ada file perangkat yang terhapus.” |
| 02:46–03:03 | Halaman **Tentang skor** (`08-penjelasan-skor.jpg`). | “Cara menghitung skor tersedia secara terbuka. Skor membandingkan ukuran file yang perlu ditinjau dengan seluruh isi folder pilihan. Skor ini bukan penilaian keamanan file, dan hasil dari folder berbeda tidak selalu bisa dibandingkan.” |
| 03:03–03:22 | Buka halaman **Riwayat** saat merekam. Gunakan hanya riwayat dari folder uji Anda. | “Pemindaian nyata menyimpan riwayat ringkasan di browser: waktu, jumlah file, potensi ruang, hasil pembersihan, dan aturan yang digunakan. Nama serta isi file tidak disimpan di riwayat. Jika ada file zona kuning, pengingat tinjau ulang muncul di aplikasi setelah sekitar satu bulan ketika aplikasi dibuka kembali.” |
| 03:22–03:48 | Kembali ke beranda atau halaman pindai. Tampilkan teks penutup. | “Untuk file sungguhan, ByteClean hanya membaca folder yang dipilih pengguna. Penghapusan nyata tersedia di Chrome atau Edge desktop, meminta izin tulis dan konfirmasi, serta dapat bersifat permanen. Browser lain tetap bisa memindai, meninjau, dan mengunduh CSV melalui mode baca saja. Jika akun organisasi sudah dihubungkan ke Supabase, admin dapat mengatur aturan pindai serta melihat ringkasan dan tren gabungan tanpa nama atau isi file. ByteClean: ruang lebih rapi, keputusan tetap di tangan Anda.” |

## Teks layar penutup

**ByteClean — temukan, tinjau, lalu putuskan.**  
**Coba mode demo tanpa akses ke folder.**

## Catatan saat merekam

- Mulai dari beranda, lalu buka `/scan?demo=1` melalui tombol demo.
- Untuk memperlihatkan tiga zona dan enam jenis temuan, gulir perlahan agar tulisan tetap terbaca.
- Pada adegan simulasi, pilih file contoh saja. Jangan memilih folder pribadi untuk rekaman.
- Jangan menyebut simulasi sebagai penghapusan nyata. Akun dan dasbor organisasi memerlukan konfigurasi Supabase aktif.
- Mode demo tidak mengisi riwayat lokal. Untuk adegan riwayat, pindai folder uji kecil terlebih dahulu, lalu rekam halaman Riwayat.
