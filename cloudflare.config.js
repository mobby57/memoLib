/**
 * CloudFlare Configuration for MemoLib
 * 
 * Features:
 * - Page Rules for caching
 * - Image Resizing service
 * - Workers for edge computing
 * - Security headers
 * - DDoS protection
 * - SSL/TLS encryption
 */

module.exports = {
    // Page Rules (order matters - first match wins)
    pageRules: [
        {
            // Static assets - aggressive caching
            targets: [
                '*.css',
                '*.js',
                '*.woff',
                '*.woff2',
                '*.ttf',
                '*.eot',
                '*.svg',
                '*.jpg',
                '*.jpeg',
                '*.png',
                '*.gif',
                '*.webp',
                '*.avif',
                '*.ico',
            ],
            actions: {
                cacheLevel: 'cache_everything',
                edgeCacheTtl: 31536000, // 1 year
                browserCacheTtl: 31536000,
            },
        },
        {
            // API endpoints - no cache
            targets: ['/api/*'],
            actions: {
                cacheLevel: 'bypass',
                securityLevel: 'high',
                ssl: 'strict',
            },
        },
        {
            // HTML pages - short cache with revalidation
            targets: ['*.html', '/'],
            actions: {
                cacheLevel: 'cache_everything',
                edgeCacheTtl: 300, // 5 minutes
                browserCacheTtl: 0, // Revalidate always
            },
        },
    ],

    // Security Headers
    securityHeaders: {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.memolib.app",
            "frame-ancestors 'self'",
        ].join('; '),
    },

    // Image Resizing
    imageResizing: {
        enabled: true,
        formats: ['webp', 'avif', 'jpeg', 'png'],
        qualities: [80, 90, 100],
        sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    },

    // Workers
    workers: {
        // Edge caching worker
        edgeCache: {
            enabled: true,
            route: '/*',
            script: './cloudflare-workers/edge-cache.js',
        },
        // Security worker
        security: {
            enabled: true,
            route: '/api/*',
            script: './cloudflare-workers/security.js',
        },
    },

    // Firewall Rules
    firewall: {
        rules: [
            {
                description: 'Block known bad bots',
                expression: '(cf.client.bot) and (not cf.verified_bot_category in {"Search Engine Crawler"})',
                action: 'challenge',
            },
            {
                description: 'Rate limit API requests',
                expression: '(http.request.uri.path contains "/api/")',
                action: 'rate_limit',
                rateLimit: {
                    threshold: 100,
                    period: 60,
                },
            },
            {
                description: 'Block suspicious countries (optional)',
                expression: '(ip.geoip.country in {"CN" "RU"})',
                action: 'challenge',
                enabled: false, // Disabled by default - enable if needed
            },
        ],
    },

    // Cache Settings
    cache: {
        // Browser cache TTL
        browserCacheTtl: {
            default: 14400, // 4 hours
            static: 31536000, // 1 year for static assets
            api: 0, // No cache for API
        },
        // Edge cache TTL
        edgeCacheTtl: {
            default: 7200, // 2 hours
            static: 31536000, // 1 year
            api: 0,
        },
        // Cache everything (even dynamic content)
        cacheEverything: true,
        // Respect origin cache headers
        respectOrigin: true,
    },

    // DDoS Protection
    ddos: {
        enabled: true,
        sensitivity: 'high',
        // HTTP/2 prioritization
        http2Prioritization: true,
        // TCP protection
        tcpProtection: true,
    },

    // SSL/TLS
    ssl: {
        // Minimum TLS version
        minTlsVersion: '1.2',
        // SSL mode
        mode: 'full_strict', // Requires valid cert on origin
        // Always use HTTPS
        alwaysUseHttps: true,
        // HSTS
        hsts: {
            enabled: true,
            maxAge: 63072000, // 2 years
            includeSubdomains: true,
            preload: true,
        },
    },

    // Performance
    performance: {
        // Auto Minify
        autoMinify: {
            html: true,
            css: true,
            js: true,
        },
        // Brotli compression
        brotli: true,
        // Early Hints
        earlyHints: true,
        // HTTP/3 (QUIC)
        http3: true,
        // Rocket Loader (defer JS)
        rocketLoader: false, // Disabled - conflicts with Next.js
        // Mirage (image optimization)
        mirage: true,
    },

    // DNS
    dns: {
        // DNSSEC
        dnssec: true,
        // CNAME flattening
        cnameFlattening: 'flatten_all',
    },

    // Analytics
    analytics: {
        // Web Analytics
        webAnalytics: true,
        // Bot Management
        botManagement: true,
    },

    // Deployment
    deployment: {
        // Zone ID (set via environment variable)
        zoneId: process.env.CLOUDFLARE_ZONE_ID,
        // API token (set via environment variable)
        apiToken: process.env.CLOUDFLARE_API_TOKEN,
    },
};
