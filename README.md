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

Heading memakai Mortane DEMO (`public/fonts/MortaneDEMO-Regular.ttf`) dan teks isi memakai Open Sauce
(diambil dari CDN jsDelivr/Fontsource). Mortane DEMO hanya berisi huruf A-Z dan a-z, jadi angka dan tanda baca
otomatis memakai Open Sauce. Versi demo biasanya tidak untuk pemakaian komersial; beli versi lengkapnya jika perlu.

## Fitur tambahan

- **Item teratas**: 10 item dengan pendapatan tertinggi, disimpan bersama jejak baru.
- **Perbandingan antar jejak**: grafik batang bertumpuk per kode (muncul jika ada 2+ jejak).
- **Cadangan**: unduh/impor semua jejak sebagai JSON.
- **Kurs dan pajak terakhir** diingat di browser.
