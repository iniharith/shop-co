import type { Metadata } from "next";
import { buildShareMetadata, fetchPublicShare } from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const response = await fetchPublicShare(`/api/files/${encodeURIComponent(id)}/info`);
  return buildShareMetadata(response?.data?.originalName || "Shared file", "file");
}

export default function FileShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
