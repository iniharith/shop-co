/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true, // This will ignore all ESLint errors during build
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
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
};

module.exports = nextConfig;
