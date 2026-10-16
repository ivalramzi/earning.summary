import "./globals.css";

// Semua teks memakai Mortane (public/fonts); angka & tanda baca memakai Open Sauce. Lihat globals.css.
export const metadata = {
  title: "Ringkasan Pendapatan",
  description: "Unggah CSV pendapatan dan lihat total per kode, pajak, dan nilai rupiah.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7e6e4" },
    { media: "(prefers-color-scheme: dark)", color: "#10141a" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
