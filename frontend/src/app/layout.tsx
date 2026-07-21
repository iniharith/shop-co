/**
 * Coded by Harith
 * Kampungcetak ®
 */
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Provider from "@/components/provider";
import Nav from "@/components/global/nav";
import { Footer } from "@/components/global/footer";
import Cta from "@/components/global/cta";

const fonarto = localFont({
  src: "./fonts/fonarto.woff",
  variable: "--font-fonarto",
});

const provicaliAmpersand = localFont({
  src: "./fonts/Provicali.otf",
  variable: "--font-provicali-ampersand",
  weight: "100 900",
  adjustFontFallback: false, declarations: [
    { prop: "unicode-range", value: "U+0026" }
  ]
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kampung Cetak",
    template: "%s | Kampung Cetak",
  },
  description: "Custom printing & frame — Kampung Cetak",
  keywords: ["kampung cetak", "custom print", "baju custom", "printing malaysia"],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "Kampung Cetak",
    title: "Kampung Cetak",
    description: "Custom printing & frame — Kampung Cetak",
  },
};

import FloatingChatWidget from "@/components/global/FloatingChatWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} ${jakarta.className}`} suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${fonarto.variable} ${provicaliAmpersand.variable} overflow-x-hidden antialiased`}
      >
        <Provider session={null}>
          <div className="site-header sticky z-50 top-0">
            <Nav />
          </div>
          <main className="relative w-full min-h-[50vh]">{children}</main>
          <div className="site-footer">
            <Cta />
            <Footer />
            <FloatingChatWidget />
          </div>
        </Provider>
      </body>
    </html>
  );
}
