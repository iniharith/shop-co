/**
 * Coded by Harith
 * Kampungcetak ®
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mail | Kampung Cetak",
  robots: { index: false, follow: false },
};

export default function MailLayout({ children }: { children: ReactNode }) {
  return <div className="mail-app">{children}</div>;
}
