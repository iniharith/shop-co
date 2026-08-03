import type { Metadata } from "next";

type ShareMetadataOptions = {
  imageUrl?: string;
  imageAlt?: string;
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
  { imageUrl = "/share-preview", imageAlt = "Kampung Cetak" }: ShareMetadataOptions = {}
): Metadata => {
  const title = `${name} | Kampung Cetak`;
  const description = `View the shared ${kind}: ${name}.`;
  const image = imageUrl === "/share-preview"
    ? { url: imageUrl, width: 1200, height: 630, alt: imageAlt }
    : { url: imageUrl, alt: imageAlt };

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
