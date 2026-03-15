import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: [
    "@sentinel/api-contracts",
    "@sentinel/config",
    "@sentinel/domain",
    "@sentinel/privacy",
    "@sentinel/ui",
    "@sentinel/validation"
  ]
};

export default nextConfig;
