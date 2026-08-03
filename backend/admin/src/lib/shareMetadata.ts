import type { Metadata } from "next";

type ShareMetadataOptions = {
  imageUrl?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageType?: string;
};

export const fetchPublicShare = async (path: string) => {
  const backend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backend) return null;

  try {
    const response = await fetch(`${backend}${path}`, { cache: "no-store" });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
};

export const buildShareMetadata = (
  name: string,
  kind: string,
  {
    imageUrl = "/share-preview",
    imageAlt = "Kampung Cetak",
    imageWidth,
    imageHeight,
    imageType,
  }: ShareMetadataOptions = {}
): Metadata => {
  const title = `${name} | Kampung Cetak`;
  const description = `View the shared ${kind}: ${name}.`;
  const image = {
    url: imageUrl,
    alt: imageAlt,
    ...((imageWidth && imageHeight) || imageUrl === "/share-preview"
      ? { width: imageWidth || 1200, height: imageHeight || 630 }
      : {}),
    ...(imageType ? { type: imageType } : {}),
  };

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
};
