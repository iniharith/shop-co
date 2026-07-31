import type { Metadata } from "next";
import { buildShareMetadata } from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ folderId: string }> }): Promise<Metadata> {
  const { folderId } = await params;
  try {
    const decoded = JSON.parse(Buffer.from(folderId, "base64").toString("utf-8"));
    return buildShareMetadata(decoded?.n || "Shared files", "folder");
  } catch {
    return buildShareMetadata("Shared files", "folder");
  }
}

export default function FolderShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
