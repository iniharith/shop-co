import type { Metadata } from "next";
import { buildShareMetadata, fetchPublicShare } from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const response = await fetchPublicShare(`/api/files/${encodeURIComponent(id)}/info`);
  const file = response?.data;
  const name = file?.originalName || "Shared file";
  const hasImagePreview =
    file?.hasThumbnail ||
    /^image\/(avif|gif|jpe?g|png|webp)$/i.test(file?.mimetype || "") ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(name);
  const imageUrl = hasImagePreview
    ? `/api/files/${encodeURIComponent(id)}/preview${file?.hasThumbnail ? "?thumbnail=true" : ""}`
    : undefined;

  return buildShareMetadata(name, "file", { imageUrl, imageAlt: name });
}

export default function FileShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
