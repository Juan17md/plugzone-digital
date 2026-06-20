import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.5.223'],
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
