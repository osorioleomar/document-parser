import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** LiteParse + sharp use native assets; bundling breaks dynamic .mjs resolution. */
  serverExternalPackages: ["@llamaindex/liteparse", "sharp"],
};

export default nextConfig;
