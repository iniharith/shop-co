/**
 * Coded by Harith
 * Kampungcetak (R)
 */
import { withSentryConfig } from "@sentry/nextjs";

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
    turbopack: {
        root: __dirname,
    },
    env: {
        NEXT_PUBLIC_BACKEND_URL: backendUrl,
    },
    transpilePackages: ['@heroui/react', '@heroui/spinner', 'framer-motion', '@tanstack/react-query', 'lucide-react', 'sonner'],
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
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

module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT,
    },
});
