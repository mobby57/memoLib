/**
 * Next.js Image Optimization Configuration
 * 
 * Features:
 * - WebP/AVIF automatic conversion
 * - Responsive image sizes
 * - Lazy loading by default
 * - CDN integration (CloudFlare)
 * - Image compression
 * - Cache optimization
 */

const nextConfig = {
    // Allow dev requests from 127.0.0.1 to _next/* resources
    allowedDevOrigins: ["127.0.0.1"],
    images: {
        // Image formats (modern formats first)
        formats: ['image/avif', 'image/webp'],

        // Device sizes for responsive images
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

        // Image sizes (for next/image)
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

        // Note: `images.domains` deprecated; using `remotePatterns` exclusively

        // Remote patterns (new Next.js 13+ way)
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
            },
        ],

        // Minimum cache TTL (in seconds)
        minimumCacheTTL: 60,

        // Disable static imports in favor of next/image
        dangerouslyAllowSVG: true,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",

        // Loader configuration (for custom CDN)
        loader: process.env.NODE_ENV === 'production' ? 'custom' : 'default',
        loaderFile: './src/lib/cdn/image-loader.ts',
    },

    // Compression
    compress: true,

    // Performance optimizations
    poweredByHeader: false, // Remove X-Powered-By header
    generateEtags: true,

    // Headers for security and caching
    async headers() {
        return [
            {
                source: '/:all*(svg|jpg|png|webp|avif)',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
