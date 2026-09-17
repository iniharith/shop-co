import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/home/shop",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
