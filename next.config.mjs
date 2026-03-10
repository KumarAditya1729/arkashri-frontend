/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercel deployment — no standalone output needed
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
};

export default nextConfig;
