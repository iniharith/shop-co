import Providers from "@/components/layout/providers";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { authConfig } from "@/lib/auth.config";
import { getServerSession } from "next-auth/next";

export const metadata: Metadata = {
  title: "Kampung Cetak Admin",
  description: "Admin dashboard for Kampung Cetak",
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  return (
    <html lang="en" className={`${jakarta.className}`} suppressHydrationWarning>
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className={"overflow-hidden bg-slate-50 text-slate-900"}>
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
