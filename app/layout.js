import { DM_Sans } from "next/font/google";
import "./globals.css";

const font = DM_Sans({ subsets: ["latin"], display: "swap" });

export const metadata = {
  title: "Ringkasan Pendapatan",
  description: "Unggah CSV pendapatan dan lihat total per kode, pajak, dan nilai rupiah.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={font.className}>{children}</body>
    </html>
  );
}
