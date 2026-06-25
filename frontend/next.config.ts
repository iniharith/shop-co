import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
