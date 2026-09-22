// Public URL used by application links in hosted deployments.
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.RAILWAY_PUBLIC_DOMAIN) {
  process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
}
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.VERCEL_URL) {
  process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.VERCEL_URL}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway self-hosted/Docker deployments require standalone output.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@prisma/client',
      'zod',
      'stripe',
      'react-hook-form',
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'production'
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: https://img.clerk.com https://*.clerk.accounts.dev; font-src 'self' data:; connect-src 'self' *.google-analytics.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://clerk-telemetry.com *.sentry.io *.upstash.io; frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; frame-ancestors 'none'"
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://localhost:* https://img.clerk.com https://*.clerk.accounts.dev; font-src 'self' data:; connect-src 'self' localhost:* https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://clerk-telemetry.com *.sentry.io *.upstash.io; frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; frame-ancestors 'self'",
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
    ];
  },
};

const { withSentryConfig } = require('@sentry/nextjs/config');

module.exports = withSentryConfig(nextConfig, {
  org: 'ms-conseils',
  project: 'javascript-nextjs-w2',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
