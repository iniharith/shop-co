/**
 * Coded by Harith
 * Kampungcetak ®
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
