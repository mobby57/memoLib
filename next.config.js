// Public URL used by application links in Vercel preview deployments.
if (!process.env.NEXT_PUBLIC_APP_URL && process.env.VERCEL_URL) {
  process.env.NEXT_PUBLIC_APP_URL = `https://${process.env.VERCEL_URL}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
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
    // Remove console logs in production
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
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          {
            key: 'Content-Security-Policy',
            value:
              process.env.NODE_ENV === 'production'
                ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel.com *.google-analytics.com https://*.clerk.accounts.dev https://clerk.memolib.fr; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' *.vercel.com *.google-analytics.com *.sentry.io *.upstash.io https://*.clerk.accounts.dev https://clerk.memolib.fr; frame-src 'self' https://*.clerk.accounts.dev; frame-ancestors 'none'"
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' localhost:* *.vercel.com https://*.clerk.accounts.dev; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob: http://localhost:*; font-src 'self' data:; connect-src 'self' localhost:* *.vercel.com *.sentry.io *.upstash.io https://*.clerk.accounts.dev; frame-src 'self' https://*.clerk.accounts.dev; frame-ancestors 'self'",
          },
        ],
      },
      // Disable caching for API routes with sensitive data
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'ms-conseils',
  project: 'javascript-nextjs-w2',

  // Jeton d'upload des source maps. Absent (local / preview sans secret) =>
  // on desactive l'upload pour ne pas faire echouer le build sur un appel
  // reseau a l'API Sentry. En CI/production, le secret est fourni et l'upload
  // s'effectue normalement.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  release: {
    create: Boolean(process.env.SENTRY_AUTH_TOKEN),
  },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
