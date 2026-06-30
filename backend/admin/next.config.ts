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
    async rewrites() {
        return {
            fallback: [
                {
                    source: '/api/:path*',
                    destination: 'http://localhost:8000/api/:path*',
                },
            ],
        };
    },
};

module.exports = nextConfig;
