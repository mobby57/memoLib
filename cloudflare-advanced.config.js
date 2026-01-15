/**
 * 🚀 CONFIGURATION CLOUDFLARE AVANCÉE
 * 
 * Optimisations pour Cloudflare Pages:
 * - Edge Functions
 * - KV Store
 * - D1 Database
 * - Cache Strategy
 * - Analytics
 * - Security Headers
 */

module.exports = {
  // ========================================
  // EDGE FUNCTIONS CONFIGURATION
  // ========================================
  
  edgeFunctions: {
    // Routes avec Edge Functions
    routes: [
      {
        path: '/api/auth/*',
        function: 'auth-edge',
        cache: false,
      },
      {
        path: '/api/health',
        function: 'health-check',
        cache: true,
        cacheTtl: 60, // 1 minute
      },
      {
        path: '/api/public/*',
        function: 'public-api',
        cache: true,
        cacheTtl: 300, // 5 minutes
      },
    ],
  },

  // ========================================
  // KV STORE CONFIGURATION
  // ========================================
  
  kv: {
    namespaces: {
      // Cache général
      CACHE: {
        binding: 'CACHE_KV',
        id: '${KV_NAMESPACE_ID}',
        preview_id: '${KV_PREVIEW_ID}',
      },
      
      // Sessions utilisateurs
      SESSIONS: {
        binding: 'SESSIONS_KV',
        id: '${SESSIONS_NAMESPACE_ID}',
        ttl: 86400, // 24 heures
      },
      
      // Rate limiting
      RATE_LIMIT: {
        binding: 'RATE_LIMIT_KV',
        id: '${RATE_LIMIT_NAMESPACE_ID}',
        ttl: 3600, // 1 heure
      },
    },
  },

  // ========================================
  // D1 DATABASE CONFIGURATION (optionnel)
  // ========================================
  
  d1: {
    databases: [
      {
        binding: 'DB',
        database_name: 'iaposte-db',
        database_id: '${D1_DATABASE_ID}',
      },
    ],
  },

  // ========================================
  // CACHE STRATEGY
  // ========================================
  
  cache: {
    // Assets statiques
    static: {
      patterns: [
        '/images/*',
        '/fonts/*',
        '/icons/*',
        '/_next/static/*',
      ],
      maxAge: 31536000, // 1 an
      immutable: true,
    },
    
    // Pages dynamiques
    dynamic: {
      patterns: [
        '/',
        '/lawyer/*',
        '/client/*',
      ],
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60,
    },
    
    // API
    api: {
      patterns: [
        '/api/public/*',
      ],
      maxAge: 60, // 1 minute
    },
  },

  // ========================================
  // SECURITY HEADERS
  // ========================================
  
  headers: {
    // Headers pour toutes les routes
    '/*': [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
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
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ],
    
    // CSP strict pour pages sensibles
    '/lawyer/*': [
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://intimate-bull-28349.upstash.io;",
      },
    ],
  },

  // ========================================
  // REDIRECTS & REWRITES
  // ========================================
  
  redirects: [
    {
      source: '/admin',
      destination: '/lawyer/dashboard',
      permanent: true,
    },
    {
      source: '/login',
      destination: '/api/auth/signin',
      permanent: false,
    },
  ],

  rewrites: [
    {
      source: '/health',
      destination: '/api/health',
    },
  ],

  // ========================================
  // ANALYTICS & MONITORING
  // ========================================
  
  analytics: {
    webVitals: true,
    
    customMetrics: [
      'auth_success',
      'auth_failure',
      'api_latency',
      'redis_hits',
      'redis_misses',
    ],
    
    sampling: {
      errors: 1.0, // 100% des erreurs
      requests: 0.1, // 10% des requêtes normales
    },
  },

  // ========================================
  // RATE LIMITING
  // ========================================
  
  rateLimiting: {
    // API publiques
    '/api/public/*': {
      limit: 100,
      window: 60, // 100 requêtes par minute
    },
    
    // API auth
    '/api/auth/*': {
      limit: 10,
      window: 60, // 10 requêtes par minute
    },
    
    // Login
    '/api/auth/signin': {
      limit: 5,
      window: 300, // 5 tentatives par 5 minutes
    },
  },

  // ========================================
  // ERROR PAGES
  // ========================================
  
  errorPages: {
    404: '/404.html',
    500: '/500.html',
  },

  // ========================================
  // ENVIRONMENT VARIABLES (production)
  // ========================================
  
  env: {
    production: {
      DATABASE_URL: 'file:./dev.db',
      NEXTAUTH_URL: 'https://iapostemanager.pages.dev',
      REDIS_ENABLED: 'true',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    
    preview: {
      DATABASE_URL: 'file:./dev.db',
      NEXTAUTH_URL: 'https://preview-${BRANCH}.iapostemanager.pages.dev',
      REDIS_ENABLED: 'true',
      NODE_ENV: 'production',
    },
  },

  // ========================================
  // BUILD CONFIGURATION
  // ========================================
  
  build: {
    command: 'npm run build',
    outputDirectory: '.next',
    
    // Variables pour build
    environment: {
      NODE_VERSION: '20',
      NPM_VERSION: '10',
    },
    
    // Optimisations
    optimization: {
      minify: true,
      bundle: true,
      treeshake: true,
    },
  },

  // ========================================
  // DEPLOYMENT SETTINGS
  // ========================================
  
  deployment: {
    // Branches pour auto-deploy
    autoDeploy: {
      production: 'main',
      preview: ['multitenant-render', 'dev', 'staging'],
    },
    
    // Rollback automatique si erreur
    autoRollback: true,
    
    // Health check avant activation
    healthCheck: {
      enabled: true,
      endpoint: '/api/health',
      timeout: 10000, // 10 secondes
      retries: 3,
    },
  },

  // ========================================
  // ADVANCED FEATURES
  // ========================================
  
  advanced: {
    // WebAssembly support
    wasm: false,
    
    // Service Workers
    serviceWorkers: true,
    
    // Streaming SSR
    streaming: true,
    
    // Image optimization
    images: {
      cloudflareImages: true,
      formats: ['webp', 'avif'],
      quality: 85,
    },
  },
}
