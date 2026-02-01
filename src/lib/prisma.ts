import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

/**
 *  Prisma Client Avance - Expert Level
 *
 * Features:
 * - Logging avance avec timing et couleurs
 * - Soft delete middleware
 * - Query metrics et monitoring
 * - Type-safe extensions
 * - Optimisations SQLite automatiques
 */

// Detection environnement de test (Jest)
const forceRealDbTests =
  process.env.REAL_DB_TESTS === '1' || process.env.USE_REAL_DB_FOR_TESTS === '1';
const isTest =
  !forceRealDbTests &&
  (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test');

// Types pour le monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

const queryMetrics: QueryMetrics[] = [];

// Configuration Prisma Client avancee
const prismaClientConfig = {
  log: [
    { level: 'query' as const, emit: 'event' as const },
    { level: 'error' as const, emit: 'event' as const },
    { level: 'warn' as const, emit: 'event' as const },
    { level: 'info' as const, emit: 'event' as const },
  ],
  errorFormat: 'colorless' as const,
};

// Singleton pattern avec type safety (hors tests)
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  prismaMetrics: QueryMetrics[] | undefined;
  optimized: boolean | undefined;
};

let prismaLocal: any;
if (isTest) {
  // Stub minimal en tests pour éviter toute connexion DB
  prismaLocal = {
    tenant: {
      findUnique: async () => null,
      findMany: async () => [],
      update: async () => ({}),
    },
    aiUsage: {
      aggregate: async () => ({ _sum: { cost: 0 } }),
    },
    aIUsageLog: {
      aggregate: async () => ({ _sum: { costEur: 0 } }),
    },
    quotaEvent: {
      create: async () => ({}),
    },
    $on: () => {},
    $use: () => {},
    $extends: () => ({}),
  };
} else {
  prismaLocal = globalForPrisma.prisma || new PrismaClient(prismaClientConfig);
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaLocal as PrismaClient;
    globalForPrisma.prismaMetrics = queryMetrics;
  }
}

export const prisma = prismaLocal as PrismaClient as any;

// ============================================
// ️ OPTIMISATIONS DATABASE AUTOMATIQUES
// ============================================

async function optimizeDatabase() {
  // Skip si déjà optimisé ou en mode Azure SWA warm-up
  if (globalForPrisma.optimized) return;

  try {
    // Detecter le type de base de donnees
    const databaseUrl = process.env.DATABASE_URL || '';
    const isPostgreSQL =
      databaseUrl.includes('postgresql') ||
      databaseUrl.includes('postgres') ||
      databaseUrl.includes('neon');
    const isSQLite = databaseUrl.includes('sqlite') || databaseUrl.includes('file:');

    if (isSQLite) {
      // Optimisations SQLite
      await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL');
      await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL');
      await prisma.$queryRawUnsafe('PRAGMA cache_size = -64000'); // 64MB
      await prisma.$queryRawUnsafe('PRAGMA temp_store = MEMORY');
      await prisma.$queryRawUnsafe('PRAGMA mmap_size = 30000000000');

      if (process.env.NODE_ENV === 'development') {
        console.log(' SQLite optimizations applied');
      }
    } else if (isPostgreSQL) {
      // PostgreSQL - pas besoin d'optimisations PRAGMA
      if (process.env.NODE_ENV === 'development') {
        console.log(' PostgreSQL connection ready');
      }
    }

    globalForPrisma.optimized = true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('️  Could not apply database optimizations:', error);
    }
  }
}

// ⚠️ NE PAS appeler optimizeDatabase() au démarrage - lazy loading
// Les optimisations seront appliquées à la première requête via ensureDbOptimized()
export async function ensureDbOptimized() {
  if (!isTest && !globalForPrisma.optimized) {
    await optimizeDatabase();
  }
}

// ============================================
//  LOGGING AVANCe AVEC METRICS
// ============================================

if (!isTest && process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    const duration = e.duration;
    const query = e.query;

    // Collecter les metrics
    queryMetrics.push({
      query: query.substring(0, 100), // Limite a 100 chars
      duration,
      timestamp: new Date(),
    });

    // Garder seulement les 100 dernieres queries
    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }

    // Log colore en developpement
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
if (!isTest)
  prisma.$use(async (params, next) => {
    // Ne pas appliquer le soft delete aux EventLog (immuabilité gérée par trigger DB)
    if (params.model === 'EventLog') {
      return next(params);
    }

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

// Exclure automatiquement les enregistrements supprimes (soft delete)
// DeSACTIVe TEMPORAIREMENT - Le modele Dossier n'a pas de champ deletedAt
/*
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
*/

// ============================================
//  EXTENSIONS - FONCTIONNALITeS AVANCeES
// ============================================

export const prismaExtended = prisma.$extends({
  name: 'advanced-features',

  // Ajouter des methodes personnalisees sur tous les modeles
  model: {
    $allModels: {
      // Methode pour recuperer avec les enregistrements supprimes
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

      // Methode pour supprimer definitivement
      async hardDelete<T>(this: T, args: any) {
        const context = Reflect.get(this, Symbol.for('prisma.client.context'));
        return (context as any).delete(args);
      },
    },
  },

  // Ajouter des methodes sur le client
  client: {
    // Obtenir les metrics de performance
    $metrics() {
      const avgDuration =
        queryMetrics.length > 0
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

    // Health check de la base de donnees
    async $health() {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date() };
      } catch (error) {
        return {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        };
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
// ️ UTILITY FUNCTIONS
// ============================================

/**
 * Ferme proprement la connexion Prisma
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Reinitialise les metrics (utile pour les tests)
 */
export function resetMetrics() {
  queryMetrics.length = 0;
}

/**
 * Export du client standard pour compatibilite
 */
export default prisma;
