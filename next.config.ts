import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output file tracing root to fix warning
  outputFileTracingRoot: __dirname,

  // Turbopack configuration
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },

  // Webpack configuration for fallback
  webpack: (config, { dev, isServer }) => {
    // Handle AbortController polyfill
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

  // Headers to prevent AbortError and improve compatibility
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },

  // Additional configuration to prevent AbortError
  swcMinify: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    domains: [],
    unoptimized: true,
  },
};

export default nextConfig;
