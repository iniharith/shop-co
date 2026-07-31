import type { Metadata } from "next";
import { buildShareMetadata, fetchPublicShare } from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const response = await fetchPublicShare(`/api/files/s/${encodeURIComponent(slug)}/meta`);
  return buildShareMetadata(response?.folderName || "Shared files", "folder");
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
