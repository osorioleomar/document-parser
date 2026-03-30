import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Use this app folder as tracing root when a parent directory has another lockfile (Vercel / monorepos). */
  outputFileTracingRoot: __dirname,
  /** LiteParse + sharp use native assets; bundling breaks dynamic .mjs resolution. */
  serverExternalPackages: ["@llamaindex/liteparse", "sharp"],
  /**
   * PDF.js loads `pdf.worker.mjs` via dynamic import; NFT does not always trace it.
   * Without this, Vercel serverless can throw: Cannot find module '.../pdf.worker.mjs'.
   */
  outputFileTracingIncludes: {
    "/api/parse": [
      "./node_modules/@llamaindex/liteparse/dist/**/*",
    ],
  },
};

export default nextConfig;
