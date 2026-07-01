/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@heroui/react', '@heroui/spinner', 'framer-motion', '@tanstack/react-query', 'lucide-react', 'sonner'],
    eslint: {
        ignoreDuringBuilds: true, // This will ignore all ESLint errors during build
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
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
                    destination: 'http://localhost:8000/api/:path*',
                },
            ],
        };
    },
};

module.exports = nextConfig;
