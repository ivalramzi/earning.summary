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

Semua teks memakai Mortane DEMO dengan 9 bobot (Thin sampai Black) di `public/fonts/`. Heading memakai bobot 600-700,
teks isi 400, label 500-600. Versi demo hanya berisi huruf A-Z dan a-z, jadi angka dan tanda baca memakai Open Sauce
(family `Angka` di `globals.css`, dari CDN jsDelivr/Fontsource) dengan bobot yang mengikuti. Jika punya versi lengkap
Mortane, cukup ganti file font. Versi demo biasanya tidak untuk pemakaian komersial.

## Fitur tambahan

- **Item teratas**: 10 item dengan pendapatan tertinggi, disimpan bersama jejak baru.
- **Perbandingan antar jejak**: grafik batang bertumpuk per kode (muncul jika ada 2+ jejak).
- **Cadangan**: unduh/impor semua jejak sebagai JSON.
- **Kurs dan pajak terakhir** diingat di browser.
