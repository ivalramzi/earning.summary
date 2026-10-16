# Ringkasan Pendapatan (Next.js)

Unggah CSV pendapatan (kolom `Title` dan `Total Earnings ($USD)`), lalu lihat total per kode
(001, 002, ...), pajak, dan nilai rupiah. File diproses di browser, tidak dikirim ke server.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
```

Build produksi: `npm run build && npm start`

## Pengaturan

- Kurs dan persentase pajak bisa diubah langsung di halaman (default 17494.13946 dan 2.66).
- Untuk mengganti default, ubah nilai awal `useState` di `app/page.js`.
- Logika hitung ada di `lib/summary.js`.

## Jejak perhitungan bulanan

Setelah menghitung, isi nama jejak (default: bulan dan tahun saat ini, bisa diganti) lalu tekan **Simpan**.
Jejak tersimpan di `localStorage` browser (lihat `lib/storage.js`): total per kode, kurs, dan pajak.
Nama yang sama akan menimpa jejak lama setelah konfirmasi. Di bagian "Jejak tersimpan" Anda bisa
membuka rincian, memuat ulang ke halaman utama, atau menghapus.

## Font

Heading memakai Instrument Serif (lewat `next/font/google` di `app/layout.js`) dan teks isi memakai
Open Sauce (`@font-face` di `app/globals.css`, diambil dari CDN jsDelivr/Fontsource). Untuk self-host Open Sauce,
taruh file `.woff2` di `public/fonts/` lalu ganti `url(...)` di `globals.css`.
