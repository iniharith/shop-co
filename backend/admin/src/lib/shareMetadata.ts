import type { Metadata } from "next";

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

export const buildShareMetadata = (name: string, kind: string): Metadata => {
  const title = `${name} | Kampung Cetak`;
  const description = `View the shared ${kind}: ${name}.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { type: "website", title, description },
    twitter: { card: "summary", title, description },
  };
};
