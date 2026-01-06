import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * 🚀 Prisma Client Avancé - Expert Level
 * 
 * Features:
 * - Logging avancé avec timing et couleurs
 * - Soft delete middleware
 * - Query metrics et monitoring
 * - Type-safe extensions
 * - Optimisations SQLite automatiques
 */

// Types pour le monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

const queryMetrics: QueryMetrics[] = [];

// Configuration Prisma Client avancée
const prismaClientConfig = {
  log: [
    { level: 'query' as const, emit: 'event' as const },
    { level: 'error' as const, emit: 'event' as const },
    { level: 'warn' as const, emit: 'event' as const },
    { level: 'info' as const, emit: 'event' as const },
  ],
  errorFormat: 'colorless' as const,
};

// Singleton pattern avec type safety
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
  prismaMetrics: QueryMetrics[];
};

export const prisma = globalForPrisma.prisma || new PrismaClient(prismaClientConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaMetrics = queryMetrics;
}

// ============================================
// ⚙️ OPTIMISATIONS SQLITE AUTOMATIQUES
// ============================================

async function optimizeSQLite() {
  try {
    // Activer WAL mode pour meilleures performances
    await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
    await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL');
    await prisma.$queryRawUnsafe('PRAGMA cache_size = -64000'); // 64MB
    await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY');
    await prisma.$queryRawUnsafe('PRAGMA mmap_size = 30000000000');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ SQLite optimizations applied');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Could not apply all SQLite optimizations');
    }
  }
}

// Appliquer les optimisations au démarrage
optimizeSQLite();

// ============================================
// 📊 LOGGING AVANCÉ AVEC METRICS
// ============================================

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration;
    const query = e.query;
    
    // Collecter les metrics
    queryMetrics.push({
      query: query.substring(0, 100), // Limite à 100 chars
      duration,
      timestamp: new Date(),
    });

    // Garder seulement les 100 dernières queries
    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }

    // Log coloré en développement
    const color = duration > 1000 ? '\x1b[31m' : duration > 100 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`${color}[Prisma Query]${reset} ${duration}ms - ${query.substring(0, 80)}...`);
  });

  prisma.$on('error' as never, (e: any) => {
    console.error('\x1b[31m[Prisma Error]\x1b[0m', e.message);
  });

  prisma.$on('warn' as never, (e: any) => {
    console.warn('\x1b[33m[Prisma Warning]\x1b[0m', e.message);
  });
}

// ============================================
// 🎯 MIDDLEWARE - SOFT DELETE & AUDIT TRAIL
// ============================================

// Soft delete middleware
prisma.$use(async (params, next) => {
  // Intercepter les delete et les transformer en update
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data != undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }

  return next(params);
});

// Exclure automatiquement les enregistrements supprimés (soft delete)
prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where = { ...params.args.where, deletedAt: null };
  }
  
  if (params.action === 'findMany') {
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    } else {
      params.args.where = { deletedAt: null };
    }
  }

  return next(params);
});

// ============================================
// 📈 EXTENSIONS - FONCTIONNALITÉS AVANCÉES
// ============================================

export const prismaExtended = prisma.$extends({
  name: 'advanced-features',
  
  // Ajouter des méthodes personnalisées sur tous les modèles
  model: {
    $allModels: {
      // Méthode pour récupérer avec les enregistrements supprimés
      async findManyWithDeleted<T>(this: T, args?: any) {
        const context = Reflect.get(this, Symbol.for('prisma.client.context'));
        return (context as any).findMany({
          ...args,
          where: {
            ...args?.where,
            // Ne pas filtrer deletedAt
          },
        });
      },
      
      // Méthode pour supprimer définitivement
      async hardDelete<T>(this: T, args: any) {
        const context = Reflect.get(this, Symbol.for('prisma.client.context'));
        return (context as any).delete(args);
      },
    },
  },
  
  // Ajouter des méthodes sur le client
  client: {
    // Obtenir les metrics de performance
    $metrics() {
      const avgDuration = queryMetrics.length > 0
        ? queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length
        : 0;
      
      const slowQueries = queryMetrics.filter(m => m.duration > 100);
      
      return {
        totalQueries: queryMetrics.length,
        averageDuration: Math.round(avgDuration * 100) / 100,
        slowQueries: slowQueries.length,
        slowQueriesDetails: slowQueries.slice(0, 10),
      };
    },
    
    // Health check de la base de données
    async $health() {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date() };
      } catch (error) {
        return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() };
      }
    },
    
    // Vacuum et optimisation
    async $optimize() {
      await prisma.$executeRawUnsafe('VACUUM');
      await prisma.$executeRawUnsafe('ANALYZE');
      return { optimized: true, timestamp: new Date() };
    },
  },
});

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

/**
 * Ferme proprement la connexion Prisma
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Réinitialise les metrics (utile pour les tests)
 */
export function resetMetrics() {
  queryMetrics.length = 0;
}

/**
 * Export du client standard pour compatibilité
 */
export default prisma;
