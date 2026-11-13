# ITC ByteClean

Starter project dengan Next.js (App Router), TypeScript, Tailwind CSS, dan Dexie.js untuk penyimpanan lokal di browser.

## Menjalankan project

Gunakan Node.js 20.9 atau lebih baru.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Jalankan `npm run lint` dan `npm run build` sebelum mengirim perubahan.

## Struktur awal

- `app/page.tsx`: halaman awal.
- `app/local-notes.tsx`: contoh komponen client yang membaca dan menulis data Dexie.
- `lib/db.ts`: skema IndexedDB. Tambahkan tabel atau versi database di sini.
- `app/globals.css`: Tailwind CSS dan gaya global.

Catatan demo hanya tersimpan di IndexedDB browser dan tidak disinkronkan ke server. Hapus komponen demo saat fitur produk mulai dibuat.
