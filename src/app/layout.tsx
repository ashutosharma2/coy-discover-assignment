import type { Metadata, Viewport } from "next";
import { Anek_Latin, Kalam, Rozha_One } from "next/font/google";
import "./globals.css";
import "./scene.css";

const rozha = Rozha_One({
  variable: "--font-rozha",
  subsets: ["latin"],
  weight: "400",
});

const anek = Anek_Latin({
  variable: "--font-anek",
  subsets: ["latin"],
  axes: ["wdth"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Discover (Coy SDE assignment)",
  description: "A swipe-based Discover tab, built as a take-home assignment for Coy.",
};

export const viewport: Viewport = {
  themeColor: "#1a2472",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${rozha.variable} ${anek.variable} ${kalam.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
