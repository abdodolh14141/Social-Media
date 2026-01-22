import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/posts/:path*',
        destination: 'http://localhost:4000/api/posts/:path*',
      },
      {
        source: '/api/messages/:path*',
        destination: 'http://localhost:4000/api/messages/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:4000/api/users/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:4000/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
