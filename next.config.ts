import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },

  // Exclude playwright from server-side bundling
  serverExternalPackages: ['playwright'],

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Enable compression
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // React strict mode for catching performance issues in dev
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/clients/:path*",
        destination: "/customers/:path*",
      },
      {
        source: "/reservations/:path*",
        destination: "/bookings/:path*",
      },
    ];
  },
};

export default nextConfig;
