import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.5.223', '100.71.35.40'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/h5w0cdkit/**',
      },
    ],
  },
};

export default nextConfig;
