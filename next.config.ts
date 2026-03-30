import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "sharp",
    "@llamaindex/liteparse",
    "@hyzyla/pdfium",
  ],
};

export default nextConfig;
