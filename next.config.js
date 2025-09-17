/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions + static export are incompatible with API routes and serverful features.
  // Disable serverActions and remove static export to allow API routes and server-side code.
  experimental: { serverActions: false },
  // output: 'export', // removed to avoid static export
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
