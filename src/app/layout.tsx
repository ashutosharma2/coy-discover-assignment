import type { Metadata, Viewport } from "next";
import { Kalam, Mukta } from "next/font/google";
import "./globals.css";

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
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
    <html lang="en" className={`${kalam.variable} ${mukta.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
