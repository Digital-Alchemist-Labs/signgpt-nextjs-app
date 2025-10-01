import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration for fallback (keep this for browser compatibility)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Basic security headers (without strict CORS that blocks API calls)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
