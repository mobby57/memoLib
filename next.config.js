/** @type {import('next').NextConfig} */
// Bundle analyzer désactivé pour build Cloudflare
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

// 🔥 STATIC EXPORT pour Azure Static Web Apps
// Note: headers() and rewrites() are NOT supported with output: 'export'
// Configure them in staticwebapp.config.json or platform-specific config instead
const isStaticExport = true;

const nextConfig = {
  reactStrictMode: true,
  
  // 🔥 STANDALONE pour Azure Static Web Apps (hybride SSR/Static)
  output: 'standalone',
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  
  // Ignore TypeScript errors for build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-icons', '@tanstack/react-query'],
  },
  
  // Compression (only works with server mode)
  compress: !isStaticExport,
  
  // ⚠️ headers() and rewrites() are NOT supported with output: 'export'
  // Security headers must be configured in:
  // - Azure: staticwebapp.config.json
  // - Cloudflare: _headers file or wrangler.toml
  // - Vercel: vercel.json
  
  // Only include headers/rewrites when NOT using static export
  ...(isStaticExport ? {} : {
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
              ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https://*.ingest.sentry.io https://*.sentry.io; worker-src 'self' blob:; frame-ancestors 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://vercel.live https://vitals.vercel-insights.com wss://ws-us3.pusher.com https://*.vercel.app https://*.ingest.sentry.io https://*.sentry.io https://o4510691517464576.ingest.de.sentry.io; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
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
  }), // End of conditional headers/rewrites block
}

// Bundle analyzer wrapper désactivé pour Cloudflare
module.exports = nextConfig;
// module.exports = withBundleAnalyzer(nextConfig);


// ⚠️  Sentry disabled for Cloudflare Pages (Windows build issue with node:inspector colons)
// TODO: Re-enable after Next.js / Turbopack fix for Windows path issues
// const { withSentryConfig } = require("@sentry/nextjs");
// 
// module.exports = withSentryConfig(module.exports, { ... })

// Fallback: export config without Sentry for now
// module.exports = nextConfig;
