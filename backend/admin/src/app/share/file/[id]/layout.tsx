import type { Metadata } from "next";
import {
  buildPdfSharePreviewUrl,
  buildShareMetadata,
  fetchPublicShare,
} from "@/lib/shareMetadata";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const response = await fetchPublicShare(`/api/files/${encodeURIComponent(id)}/info`);
  const file = response?.data;
  const name = file?.originalName || "Shared file";
  const isImage =
    /^image\/(avif|gif|jpe?g|png|webp)$/i.test(file?.mimetype || "") ||
    /\.(avif|gif|jpe?g|png|webp)$/i.test(name);
  const isPdf =
    /^application\/pdf(?:$|;)/i.test(file?.mimetype || "") ||
    /\.pdf$/i.test(name);
  const usesGeneratedPdfPreview = isPdf && !file?.hasThumbnail;
  const imageUrl = file?.hasThumbnail
    ? `/api/files/${encodeURIComponent(id)}/preview?thumbnail=true`
    : isImage
      ? `/api/files/${encodeURIComponent(id)}/preview`
      : usesGeneratedPdfPreview
        ? buildPdfSharePreviewUrl(id)
        : undefined;

  return buildShareMetadata(name, "file", {
    imageUrl,
    imageAlt: name,
    imageWidth: usesGeneratedPdfPreview ? 1200 : undefined,
    imageHeight: usesGeneratedPdfPreview ? 630 : undefined,
    imageType: usesGeneratedPdfPreview ? "image/jpeg" : undefined,
  });
}

export default function FileShareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
