/** @type {import('next').NextConfig} */
const nextConfig = {
  // On ignore le type check au build (on le fait séparément avec tsc)
  typescript: {
    ignoreBuildErrors: true,
  },
    // Tes configurations existantes (si tu en avais)
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.clerk.accounts.dev' },
      { protocol: 'https', hostname: 'img.clerk.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
