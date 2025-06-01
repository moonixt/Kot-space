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
};

export default nextConfig;
