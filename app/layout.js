import "./globals.css";

// Semua teks memakai Mortane (public/fonts); angka & tanda baca meminjam Open Sauce. Lihat globals.css.
export const metadata = {
  title: "Ringkasan Pendapatan",
  description: "Unggah CSV pendapatan dan lihat total per kode, pajak, dan nilai rupiah.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#e7e6e4" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
