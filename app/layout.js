import "./globals.css";

// Heading: Mortane (public/fonts). Body: Open Sauce. Keduanya dimuat lewat @font-face di globals.css.
export const metadata = {
  title: "Ringkasan Pendapatan",
  description: "Unggah CSV pendapatan dan lihat total per kode, pajak, dan nilai rupiah.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
