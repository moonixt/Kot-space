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
  // Configuração de headers para resolver problemas de CORS e acesso a arquivos estáticos
  async headers() {
    return [
      {
        // Configuração para todos os paths
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Permitir acesso de qualquer origem
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
      {
        // Configuração específica para manifest.json
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
