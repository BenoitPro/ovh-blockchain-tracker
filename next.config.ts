import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['@libsql/client'],
  async redirects() {
    return [
      { source: '/explorer', destination: '/nodes', permanent: true },
      { source: '/team', destination: '/about', permanent: true },
    ];
  },
};

export default nextConfig;
