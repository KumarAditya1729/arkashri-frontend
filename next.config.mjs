/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // Keep build checks enabled so CI catches broken pages before deploy.
};

export default nextConfig;
