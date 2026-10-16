import { Instrument_Serif } from "next/font/google";
import "./globals.css";

// Heading: Instrument Serif. Body: Open Sauce (dimuat lewat @font-face di globals.css).
const heading = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-heading",
});

export const metadata = {
  title: "Ringkasan Pendapatan",
  description: "Unggah CSV pendapatan dan lihat total per kode, pajak, dan nilai rupiah.",
};

export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={heading.variable}>
      <body>{children}</body>
    </html>
  );
}
