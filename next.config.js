/** @type {import('next').NextConfig} */
// Bundle analyzer désactivé pour build Cloudflare
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

const nextConfig = {
  reactStrictMode: true,
  
  // Standalone pour Cloudflare Workers (pas pour Vercel)
  output: 'standalone',
  
  // Ignore TypeScript errors for build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', '@tanstack/react-query'],
  },
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  
  // Security & Performance headers - BEST PRACTICES 2026
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          
          // HSTS - Force HTTPS (2 ans + subdomains + preload)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          
          // XSS Protection (legacy mais encore utile)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          
          // Clickjacking Protection - DENY (plus strict que SAMEORIGIN)
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          
          // MIME Sniffing Protection - CRITIQUE
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          
          // Referrer Policy - Protection données navigation
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          
          // Permissions Policy - Bloquer APIs dangereuses
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()'
          },
          
          // CSP - Content Security Policy RENFORCÉ + SENTRY
          {
            key: 'Content-Security-Policy',
            value: isDev 
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https://*.ingest.sentry.io https://*.sentry.io; frame-ancestors 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://vercel.live https://vitals.vercel-insights.com wss://ws-us3.pusher.com https://*.vercel.app https://*.ingest.sentry.io https://*.sentry.io https://o4510691517464576.ingest.de.sentry.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
          },
          
          // Cross-Origin Policies
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin'
          },
          
          // Security Headers additionnels
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none'
          },
          {
            key: 'X-Download-Options',
            value: 'noopen'
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Proxy API vers backend Flask (dev uniquement)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/backend/:path*',
          destination: 'http://localhost:5005/api/:path*',
        },
      ]
    }
    return []
  },
}

// Bundle analyzer wrapper désactivé pour Cloudflare
module.exports = nextConfig;
// module.exports = withBundleAnalyzer(nextConfig);


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "ms-conseils",
  project: "iapostemanage-nextjs",

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
  tunnelRoute: "/monitoring",

  // Hide source maps from generated client bundles (security)
  hideSourceMaps: true,

  // Disable Sentry SDK debug logs in production
  disableLogger: process.env.NODE_ENV === 'production',

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
