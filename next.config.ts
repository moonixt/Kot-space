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
};

export default nextConfig;
