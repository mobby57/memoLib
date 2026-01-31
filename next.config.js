/** @type {import('next').NextConfig} */
// Bundle analyzer désactivé pour build Cloudflare
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// });

// 🔥 Detect platform for optimal build output
const isVercel = process.env.VERCEL === '1';
const isAzure = process.env.AZURE_STATIC_WEB_APPS === 'true';
const isAzureStaticExport = process.env.AZURE_STATIC_EXPORT === 'true';
const isStaticExport = isAzureStaticExport; // Only enable for pure static export (no APIs)
const isWindows = process.platform === 'win32';

// 🔥 Determine output mode based on platform
// - 'export': Azure SWA static (generates /out folder)
// - 'standalone': Vercel, Docker, self-hosted (generates .next/standalone)
// - undefined: Default Next.js behavior (Windows avoids standalone due to colon issues)
const getOutputMode = () => {
  if (isAzureStaticExport) return 'export';
  if (isVercel) return undefined; // Vercel handles this automatically
  if (isWindows && !process.env.FORCE_STANDALONE) return undefined; // Avoid Windows path issues
  return 'standalone'; // Default for other platforms (Linux, macOS)
};

const nextConfig = {
  reactStrictMode: true,

  // 🌐 Allowed dev origins for Codespaces and local development
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '*.app.github.dev',
    '*.preview.app.github.dev',
    '*.devtunnels.ms',
  ],

  // 🔥 Dynamic output based on deployment platform
  // Azure SWA REQUIRES 'export' for static hosting
  output: getOutputMode(),

  // 🖼️ Image optimization - Next.js 16 Best Practices
  images: isStaticExport
    ? {
        unoptimized: true, // Required for static export
      }
    : {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000, // 1 an de cache
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        // Domaines autorisés pour les images externes
        remotePatterns: [
          {
            protocol: 'https',
            hostname: '**.githubusercontent.com',
          },
          {
            protocol: 'https',
            hostname: '**.googleusercontent.com',
          },
          {
            protocol: 'https',
            hostname: 'avatars.githubusercontent.com',
          },
        ],
      },

  // TypeScript configuration
  typescript: {
    // Ne pas ignorer les erreurs TypeScript au build
    ignoreBuildErrors: false,
  },

  //  Performance optimizations - Next.js 16 Best Practices
  experimental: {
    optimizeCss: true,
    // Optimise les imports de packages lourds (tree-shaking automatique)
    optimizePackageImports: [
      'react-icons',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'recharts',
      'lodash',
    ],
    // Partial Prerendering (PPR) - Next.js 15+ feature
    // ppr: true, // Décommenter quand stable
  },

  // 🔒 Désactiver le header X-Powered-By pour la sécurité
  poweredByHeader: false,

  // Compression (only works with server mode)
  compress: !isStaticExport,

  // ⚡ Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // � Turbopack Configuration - Next.js 16 Best Practices
  turbopack: {
    // 📁 Resolve aliases for cleaner imports
    resolveAlias: {
      '@': './src',
      '@/components': './src/components',
      '@/lib': './src/lib',
      '@/hooks': './src/hooks',
      '@/utils': './src/utils',
      '@/types': './src/types',
      '@/styles': './src/styles',
      '@/services': './src/services',
      '@/app': './src/app',
      '@/pages': './src/pages',
    },

    // 📦 Custom resolve extensions
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],

    // 🎨 Webpack loaders for Turbopack
    rules: {
      // SVG as React components (with @svgr/webpack)
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },

    // 🐛 Debug IDs for better debugging in production
    debugIds: process.env.NODE_ENV === 'development',
  },

  // 🔥 Minimal webpack config - DO NOT override resolve.alias (legacy fallback)
  webpack: (config, { isServer }) => {
    // SVG loader fallback for webpack (when not using Turbopack)
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Return config
    return config;
  },

  // ⚠️ headers() and rewrites() are NOT supported with output: 'export'
  // Security headers must be configured in:
  // - Azure: staticwebapp.config.json
  // - Cloudflare: _headers file or wrangler.toml
  // - Vercel: vercel.json

  // Only include headers/rewrites when NOT using static export
  ...(isStaticExport
    ? {}
    : {
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
                  value: 'on',
                },

                // HSTS - Force HTTPS (2 ans + subdomains + preload)
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },

                // XSS Protection (legacy mais encore utile)
                {
                  key: 'X-XSS-Protection',
                  value: '1; mode=block',
                },

                // Clickjacking Protection - DENY (plus strict que SAMEORIGIN)
                {
                  key: 'X-Frame-Options',
                  value: 'DENY',
                },

                // MIME Sniffing Protection - CRITIQUE
                {
                  key: 'X-Content-Type-Options',
                  value: 'nosniff',
                },

                // Referrer Policy - Protection données navigation
                {
                  key: 'Referrer-Policy',
                  value: 'strict-origin-when-cross-origin',
                },

                // Permissions Policy - Bloquer APIs dangereuses
                {
                  key: 'Permissions-Policy',
                  value:
                    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()',
                },

                // CSP - Content Security Policy RENFORCÉ + SENTRY
                {
                  key: 'Content-Security-Policy',
                  value: isDev
                    ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: https://*.ingest.sentry.io https://*.sentry.io; worker-src 'self' blob:; frame-ancestors 'self';"
                    : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://vercel.live https://vitals.vercel-insights.com wss://ws-us3.pusher.com https://*.vercel.app https://*.ingest.sentry.io https://*.sentry.io https://o4510691517464576.ingest.de.sentry.io; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
                },

                // Cross-Origin Policies
                {
                  key: 'Cross-Origin-Embedder-Policy',
                  value: 'credentialless',
                },
                {
                  key: 'Cross-Origin-Opener-Policy',
                  value: 'same-origin',
                },
                {
                  key: 'Cross-Origin-Resource-Policy',
                  value: 'same-origin',
                },

                // Security Headers additionnels
                {
                  key: 'X-Permitted-Cross-Domain-Policies',
                  value: 'none',
                },
                {
                  key: 'X-Download-Options',
                  value: 'noopen',
                },
              ],
            },
            {
              source: '/static/(.*)',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ];
        },

        // Proxy API vers backend Flask (dev uniquement)
        async rewrites() {
          if (process.env.NODE_ENV === 'development') {
            return [
              {
                source: '/api/backend/:path*',
                destination: 'http://localhost:5005/api/:path*',
              },
            ];
          }
          return [];
        },
      }), // End of conditional headers/rewrites block
};

// 🔐 Sentry Configuration - DISABLED for Azure builds (Sentry was uninstalled)
// For Azure deployments, Sentry monitoring is not available
// To re-enable: npm install @sentry/nextjs and uncomment the code below

/*
const { withSentryConfig } = require("@sentry/nextjs");

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG || "memoLib",
  project: process.env.SENTRY_PROJECT || "memoLib",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  dryRun: process.env.NODE_ENV !== 'production',
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
};

const sentryOptions = {
  hideSourceMaps: true,
  disableLogger: true,
  transpileClientSDK: true,
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,
};
*/

// Export config directly (Sentry disabled)
module.exports = nextConfig;
