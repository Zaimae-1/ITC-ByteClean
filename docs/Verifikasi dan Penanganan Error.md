# Verifikasi dan Penanganan Error ByteClean

## Lingkup versi lokal

ByteClean memeriksa folder lokal yang dipilih pengguna. File tidak diunggah. Ruang yang dilaporkan adalah ruang lokal, bukan penghematan listrik atau emisi pusat data. Integrasi Google Drive belum ada.

## Pemeriksaan per tahap

1. **Jalankan aplikasi:** gunakan Node.js 20.9+, `npm install`, lalu `npm run dev`. Pastikan beranda, `/scan`, `/history`, dan `/score` terbuka.
2. **Pindai:** pilih folder uji yang berisi file kembar, file sementara lama, file biasa, dan subfolder. Pastikan jumlah file benar. File atau folder yang tidak terbaca harus dilaporkan; hasil file lain tetap muncul.
3. **Periksa hasil:** salinan kembar tambahan dan file sementara lama masuk zona hijau; kandidat lain masuk kuning; file tanpa temuan dan salinan yang dipertahankan masuk merah. Satu file pada beberapa kategori hanya dihitung sekali dalam potensi ruang.
4. **Tinjau:** coba pencarian, filter, urutan, tombol Lindungi, dan ekspor CSV. Tidak ada file yang dipilih otomatis. Zona merah tidak dapat dipilih.
5. **Hapus:** uji hanya dengan folder yang sengaja dibuat untuk pengujian. Di Chrome/Edge desktop, pilih file, lihat jumlah dan ukuran pada dialog konfirmasi, lalu beri izin tulis. Pastikan file yang berubah sejak pindai dilewati. Untuk file kembar, pastikan setidaknya satu salinan yang cocok masih ada. Penghapusan dapat permanen dan tidak melalui Tempat Sampah.
6. **Browser lain:** gunakan pemilih folder mode baca. Hasil dan CSV harus tersedia, sedangkan tombol hapus nyata tidak aktif.
7. **Riwayat dan pengingat:** setelah pindai nyata, buka Riwayat untuk melihat ringkasan. Pengingat zona kuning muncul saat aplikasi dibuka setelah sekitar 30 hari; ini bukan email atau notifikasi sistem.
8. **Pemeriksaan kode:** jalankan `npm test`, `npm run lint`, dan `npm run build` sebelum commit dan push.

## Jika terjadi error

| Gejala | Pemeriksaan dan tindakan |
| --- | --- |
| Folder tidak dapat dipilih | Periksa dukungan browser dan izin baca. Coba mode baca saja atau folder uji yang lebih kecil. |
| Pemindaian berhenti | Baca pesan error. Jika melebihi batas file, pilih subfolder. Jika worker gagal dimulai, muat ulang halaman atau coba browser lain. |
| Sebagian file tidak muncul sebagai duplikat | Lihat jumlah file yang gagal diperiksa sebagai duplikat. File lain tetap ditampilkan; ulangi pindai saat file dapat dibaca. |
| Hapus gagal | Periksa izin tulis dan apakah file berubah atau salinan yang dipertahankan hilang. Pindai ulang sebelum mencoba lagi. Jangan menganggap file gagal sudah terhapus. |
| Riwayat tidak tersimpan | Periksa apakah penyimpanan browser diizinkan. Hasil pindai tetap dapat dilihat pada sesi aktif. |
| Build atau tes gagal | Catat pesan pertama yang relevan, ulangi kasus dengan folder uji kecil, perbaiki penyebab, lalu jalankan kembali tes terkait dan build. |

Mode demo di `/scan?demo=1` memakai data sintetis dan tidak menghapus file perangkat. Pengujian otomatis tidak menggantikan pengujian alur folder nyata pada browser sasaran.
