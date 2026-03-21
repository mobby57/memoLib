/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  images: {
    unoptimized: true
  }
};

module.exports = nextConfig;