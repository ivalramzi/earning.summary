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

Teks memakai Mortane DEMO (`public/fonts/`, bobot Regular 400 dan Medium 500). Versi demo hanya berisi huruf A-Z dan a-z,
jadi semua angka, "Rp", "$", dan tanda baca pada nilai memakai font cadangan **Angka** (family `Angka` di `globals.css`).
Angka adalah subset Liberation Sans (SIL OFL 1.1) yang sudah ada di `public/fonts/` (`Angka-Regular.woff`, `Angka-Medium.woff`),
jadi tidak ada permintaan ke CDN dan tampilan tidak berubah saat offline. Lisensinya ada di `public/fonts/LICENSE-Angka.txt`.
Bobot 500 dipetakan ke Liberation Sans Bold (tidak ada bobot menengah). Jika punya Open Sauce atau font angka lain, ganti dua file
`.woff` itu (atau ubah `url()` di `globals.css`). Jika punya Mortane versi lengkap, ganti file font dan ubah `--numfont`
agar sama dengan `--body`. Versi demo Mortane biasanya tidak untuk pemakaian komersial.

## Fitur tambahan

- **Item teratas**: 10 item dengan pendapatan tertinggi, disimpan bersama jejak baru.
- **Perbandingan antar jejak**: grafik batang bertumpuk per kode (muncul jika ada 2+ jejak). Tiap kode punya warna dan pola (garis, titik, dst.), jadi tidak bergantung pada warna saja.
- **Cadangan**: unduh/impor semua jejak sebagai JSON. Banner dan titik kuning di menu "Jejak" muncul jika ada jejak yang belum masuk cadangan terakhir.
- **Kurs dan pajak terakhir** diingat di browser.

## Tampilan

- Desktop: dua kolom (unggah dan pengaturan di kiri, hasil di kanan). Mobile: satu kolom, tabel menjadi kartu.
- Mode terang dan gelap mengikuti pengaturan perangkat.
- Tabel: kolom Rupiah ada di depan, dan kolom Kelompok tetap terlihat saat tabel digeser.
- Kurs dan pajak menerima koma atau titik sebagai desimal (`17494,13946` atau `17494.13946`).
