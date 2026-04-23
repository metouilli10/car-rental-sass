import path from "node:path";
import { fileURLToPath } from "node:url";
import withVercelToolbar from "@vercel/toolbar/plugins/next";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDevLike = process.env.NODE_ENV !== "production";
const vercelToolbarEnabled = isDevLike || process.env.VERCEL_TOOLBAR_ENABLED === "true";
const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  ...(isDevLike ? ["'unsafe-eval'"] : []),
  ...(vercelToolbarEnabled ? ["https://vercel.live"] : []),
].join(" ");
const connectSrc = [
  "'self'",
  "https://*.supabase.co",
  "https://api.resend.com",
  ...(vercelToolbarEnabled ? ["https://vercel.live", "http://localhost:43214"] : []),
].join(" ");
const frameSrc = [
  "'self'",
  ...(vercelToolbarEnabled ? ["https://vercel.live"] : []),
].join(" ");
const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https://*.supabase.co",
  "https://images.unsplash.com",
  ...(vercelToolbarEnabled ? ["https://vercel.live"] : []),
].join(" ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      `img-src ${imgSrc}`,
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      `script-src ${scriptSrc}`,
      `connect-src ${connectSrc}`,
      `frame-src ${frameSrc}`,
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,

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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'],
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

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/internal/:path*",
        headers: [
          ...securityHeaders,
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

export default withVercelToolbar()(nextConfig);
