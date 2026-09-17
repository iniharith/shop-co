import type { MetadataRoute } from "next";

const baseUrl = "https://kampungcetak.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const productUrls = Array.from({ length: 54 }, (_, index) => ({
    url: `${baseUrl}/home/shop/prod-${index + 100}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/support`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/delivery-details`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/home/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/home/islamic-khat`, changeFrequency: "monthly", priority: 0.6 },
    ...productUrls,
  ];
}
