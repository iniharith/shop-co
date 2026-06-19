import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import Provider from "@/components/provider";
import Nav from "@/components/global/nav";
import { Footer } from "@/components/global/footer";
import Cta from "@/components/global/cta";
import { getServerSession } from "next-auth";
import { authConfig } from "@/config/auth.config";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authConfig);
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${dmSans.variable} overflow-x-hidden w-screen ${geistMono.variable} bg-gray-100 dark:bg-background antialiased`}
      >
        <Provider session={session}>
          <div className="sticky z-50 top-0">
            <Nav />
          </div>
          <div className="w-full min-h-[50vh]">{children}</div>
          <Cta />
          <Footer />
          <FloatingChatWidget />
        </Provider>
      </body>
    </html>
  );
}