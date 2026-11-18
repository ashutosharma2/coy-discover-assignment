import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Manrope } from "next/font/google";
import { THEME_COLORS, themeScript } from "@/lib/client/theme";
import "./globals.css";
import "./scene.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Discover (Coy SDE assignment)",
  description: "A swipe-based Discover tab, built as a take-home assignment for Coy.",
};

export const viewport: Viewport = {
  themeColor: THEME_COLORS.night,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme is set on this element before the first paint, so React shouldn't compare it.
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} ${caveat.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
