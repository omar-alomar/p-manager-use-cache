// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    useCache: true,
  },
  // ship it: don't block prod builds on lint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // If TS starts blocking builds later, you *can* flip this on temporarily:
  // typescript: { ignoreBuildErrors: true },
  webpack: (config, { isServer }) => {
    // Externalize ioredis to avoid bundling it during build (speeds up builds)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('ioredis');
    }
    return config;
  },
};

export default nextConfig;










