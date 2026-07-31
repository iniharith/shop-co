import type { Metadata } from "next";
import { buildShareMetadata, fetchPublicShare } from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const response = await fetchPublicShare(`/api/projects/shared/${encodeURIComponent(token)}/meta`);
  return buildShareMetadata(response?.data?.title || "Shared project", "project");
}

export default function ProjectShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
