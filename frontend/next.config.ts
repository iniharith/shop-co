/**
 * Coded by Harith
 * Kampungcetak ®
 */
import type { NextConfig } from "next";

const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const staleBackendUrls = new Set(["https://api.studioivory.art"]);
const backendUrl = configuredBackendUrl && !staleBackendUrls.has(configuredBackendUrl)
  ? configuredBackendUrl
  : process.env.NODE_ENV === "production"
    ? "https://shop-co-production.up.railway.app"
    : "http://localhost:8000";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_BACKEND_URL: backendUrl,
  },
  images: {
    // Let Next serve responsive sizes and modern formats for catalog imagery.
    unoptimized: false,
    remotePatterns: [
      {
        hostname: "placehold.co",
      },
      {
        hostname: "loremflickr.com",
      },
      {
        hostname: "images.pexels.com",
      },
      {
        hostname: "localhost",
        protocol: "http",
      },
      {
        hostname: "api.studioivory.art",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
      {
        hostname: "kampungcetak-storage.s3.ap-southeast-5.amazonaws.com",
        protocol: "https",
      },
      {
        hostname: "shop-co-production.up.railway.app",
        protocol: "https",
      },
      {
        hostname: "kampungcetak.com",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
