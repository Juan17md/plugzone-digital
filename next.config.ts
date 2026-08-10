import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.5.223', '100.71.35.40'],
};

export default withSentryConfig(nextConfig, {
  org: "juan17md",
  project: "plugzone-digital",
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
