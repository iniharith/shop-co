/**
 * Coded by Harith
 * Kampungcetak ®
 */
import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { authConfig } from "@/lib/auth.config";
import { getServerSession } from "next-auth/next";

export const metadata: Metadata = {
  title: "Kampung Cetak Admin Console",
  description: "Admin dashboard for Kampung Cetak",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  return (
    <html lang="en" className={`${jakarta.variable} ${spaceGrotesk.variable} ${jakarta.className} overflow-x-hidden`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var low=matchMedia('(pointer: coarse) and (hover: none)').matches||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(low)document.documentElement.classList.add('low-power-ui')}catch(e){}`,
          }}
        />
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <NextTopLoader shadow="0 0 10px #10b981" color="#10b981" showSpinner={false} />
        <NuqsAdapter>
          <Providers session={session}>
            <Toaster theme="light" />
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
