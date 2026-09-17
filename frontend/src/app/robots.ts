import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/home/profile/", "/home/cart/", "/email/", "/api/", "/task-access/"],
    },
    sitemap: "https://kampungcetak.com/sitemap.xml",
    host: "https://kampungcetak.com",
  };
}
