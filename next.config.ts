import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted Node bundle at dist/standalone/ (run with `npm run start`).
  output: "standalone",
};

export default nextConfig;
