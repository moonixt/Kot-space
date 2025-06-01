import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["gnzvtcsfhwadbhcxwmpy.supabase.co"],
  },
  // Add transpilation configuration for Supabase modules
  transpilePackages: [
    "@supabase/supabase-js",
    "@supabase/auth-helpers-nextjs",
    "@supabase/node-fetch",
  ],
  webpack: (config, { isServer }) => {
    // Handle React Native dependencies that might be imported by jsmediatags
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "react-native-fs": false,
      "react-native": false,
    };

    // Ignore React Native modules in client-side bundles
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-native-fs": false,
        "react-native": false,
      };
    }

    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' ",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
              "frame-src 'self' https://challenges.cloudflare.com",
              "connect-src 'self' https://challenges.cloudflare.com https://*.supabase.co",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:"
            ].join('; ')
          }
        ]
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['@cloudflare/turnstile']
  }
};

export default nextConfig;
