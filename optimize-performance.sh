#!/bin/bash

# 🚀 Script d'Optimisation Performance - MemoLib
# Objectif: Améliorer la note de performance

echo "🚀 Optimisation Performance MemoLib..."

# 1. Database Optimization
echo "📊 Optimisation Base de Données..."

# Ajouter index manquants
cat > prisma/migrations/add_performance_indexes.sql << 'EOF'
-- Index pour améliorer les performances
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_email ON "User"(tenant_id, email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dossiers_status_priority ON "Dossier"(statut, priorite);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_processed_category ON "Email"(is_processed, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_tenant_type ON "Document"(tenant_id, mime_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_eventlogs_timestamp_type ON "event_logs"(timestamp, event_type);

-- Index composites pour requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_tenant_status_name ON "Client"(tenant_id, status, last_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_factures_client_status_date ON "Facture"(client_id, statut, date_emission);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deadlines_tenant_status_due ON "LegalDeadline"(tenant_id, status, due_date);
EOF

# 2. Next.js Optimization
echo "⚡ Optimisation Next.js..."

# Configuration optimisée
cat > next.config.performance.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'react-icons',
      '@tanstack/react-query',
      'lucide-react',
      'date-fns',
      'recharts',
      'lodash'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },
  
  // Compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256]
  },
  
  // Bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    };
    
    return config;
  }
};

module.exports = nextConfig;
EOF

# 3. Cache Configuration
echo "🗄️ Configuration Cache Redis..."

cat > src/lib/cache/redis-optimized.ts << 'EOF'
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  
  // Performance optimizations
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxLoadingTimeout: 1000,
  
  // Connection pooling
  lazyConnect: true,
  keepAlive: 30000,
  
  // Compression
  compression: 'gzip'
});

// Cache strategies
export const cacheStrategies = {
  // Short-term cache (5 minutes)
  shortTerm: 300,
  // Medium-term cache (1 hour)  
  mediumTerm: 3600,
  // Long-term cache (24 hours)
  longTerm: 86400,
  // Static cache (7 days)
  static: 604800
};

export { redis };
EOF

# 4. Database Connection Pooling
echo "🔗 Configuration Connection Pooling..."

cat > prisma/connection-pool-optimized.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Connection pooling optimization
  __internal: {
    engine: {
      connectionLimit: 20,
      poolTimeout: 10000,
      binaryTargets: ['native', 'debian-openssl-3.0.x']
    }
  },
  
  // Query optimization
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
  
  // Error formatting
  errorFormat: 'minimal'
});

module.exports = { prisma };
EOF

# 5. Performance Monitoring
echo "📈 Configuration Monitoring Performance..."

cat > src/lib/monitoring/performance.ts << 'EOF'
// Performance monitoring utilities
export class PerformanceMonitor {
  static startTimer(label: string) {
    console.time(label);
  }
  
  static endTimer(label: string) {
    console.timeEnd(label);
  }
  
  static measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const start = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - start;
        console.log(`${label}: ${duration}ms`);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static logMemoryUsage() {
    const used = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100 + ' MB',
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100 + ' MB'
    });
  }
}
EOF

# 6. Bundle Analysis
echo "📦 Analyse Bundle Size..."

# Installer bundle analyzer si pas présent
npm install --save-dev @next/bundle-analyzer

# Script d'analyse
cat > scripts/analyze-bundle.js << 'EOF'
const { execSync } = require('child_process');

console.log('🔍 Analyse du bundle...');

// Build avec analyse
execSync('ANALYZE=true npm run build', { stdio: 'inherit' });

console.log('📊 Rapport généré dans .next/analyze/');
console.log('🎯 Objectifs:');
console.log('  - Bundle principal < 250KB');
console.log('  - Chunks vendors < 500KB');
console.log('  - Score Lighthouse > 90');
EOF

# 7. Lighthouse CI Configuration
echo "🏆 Configuration Lighthouse CI..."

cat > .lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
EOF

echo "✅ Optimisations appliquées!"
echo "🚀 Prochaines étapes:"
echo "  1. npm run build (vérifier temps de build)"
echo "  2. npm run analyze (analyser bundle)"
echo "  3. npm run lighthouse (score performance)"
echo "  4. npm run test:performance (tests perf)"

echo "🎯 Objectif: Note Performance 7.5 → 9.0"