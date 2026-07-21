/**
 * Coded by Harith
 * Kampungcetak ®
 */
/** @type {import('next').NextConfig} */
const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
const staleBackendUrls = new Set([
    "https://admin.kampungcetak.com",
    "https://api.studioivory.art",
]);
const backendUrl = configuredBackendUrl && !staleBackendUrls.has(configuredBackendUrl)
    ? configuredBackendUrl
    : process.env.NODE_ENV === "production"
        ? "https://shop-co-production.up.railway.app"
        : "http://localhost:8000";

const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: backendUrl,
    },
    transpilePackages: ['@heroui/react', '@heroui/spinner', 'framer-motion', '@tanstack/react-query', 'lucide-react', 'sonner'],
    eslint: {
        ignoreDuringBuilds: true, // This will ignore all ESLint errors during build
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        // Images are already optimized via AWS S3 — skip Vercel's transformation pipeline
        unoptimized: true,
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
            {
                protocol: "http",
                hostname: "**",
            },
        ],
    },
    async rewrites() {
        return {
            fallback: [
                {
                    source: '/api/:path*',
                    destination: `${backendUrl}/api/:path*`,
                },
            ],
        };
    },
};

module.exports = nextConfig;
