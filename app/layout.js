import "./globals.css";
import { Noto_Serif_Devanagari } from "next/font/google";

const noto = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "?????? ? ?? ??? ???",
  description: "???? ?? ???, ?????? ?? ???, ????? ?? ??? ?? ???????",
  metadataBase: new URL("https://agentic-2dd3a2c4.vercel.app"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="hi">
      <body className={noto.className}>{children}</body>
    </html>
  );
}
