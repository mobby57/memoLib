// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ============================================
// 1. MÉTRIQUES
// ============================================

export const queryMetrics: Array<{
  query: string;
  duration: number;
  timestamp: Date;
}> = [];

export function collectMetric(query: string, duration: number) {
  if (process.env.NODE_ENV === 'test') return;

  queryMetrics.push({
    query,
    duration,
    timestamp: new Date(),
  });
}

export function resetMetrics() {
  queryMetrics.length = 0;
}

export function getMetrics() {
  return [...queryMetrics];
}

// ============================================
// 2. TEST STUB
// ============================================

function createTestStub(): any {
  const stubModel = (methods: any) => methods;

  return {
    tenant: stubModel({
      update: () => Promise.resolve({}),
      findUnique: () => Promise.resolve(null),
      findMany: () => Promise.resolve([]),
      create: () => Promise.resolve({}),
      delete: () => Promise.resolve({}),
    }),

    aiUsage: stubModel({
      aggregate: () =>
        Promise.resolve({
          _sum: {
            cost: 0,
          },
        }),

      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    }),

    aIUsageLog: stubModel({
      aggregate: () =>
        Promise.resolve({
          _sum: {
            costEur: 0,
          },
        }),

      create: () => Promise.resolve({}),
    }),

    quotaEvent: stubModel({
      create: () => Promise.resolve({}),
      findMany: () => Promise.resolve([]),
    }),

    // Prisma lifecycle / middleware compatibility
    $on: () => undefined,

    $use: () => undefined,

    $executeRaw: () => Promise.resolve(0),

    $queryRaw: () => Promise.resolve([]),

    $transaction: async (fn: any) => {
      return fn(createTestStub());
    },

    $connect: () => Promise.resolve(),

    $disconnect: () => Promise.resolve(),
  };
}

// ============================================
// 3. CLIENT PRISMA RÉEL
// ============================================

function createRealClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('[DB] DATABASE_URL is not defined');
  }

  // Prisma 7 requiert un driver adapter. On utilise pg via PrismaPg.
  const adapter = new PrismaPg({ connectionString });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  });

  // Middleware Prisma pour mesurer les requêtes lentes
  client.$use(async (params, next) => {
    const start = Date.now();

    const result = await next(params);

    const duration = Date.now() - start;

    if (duration > 100) {
      collectMetric(
        `${params.model}.${params.action}`,
        duration
      );
    }

    return result;
  });

  return client;
}

// ============================================
// 4. CLIENT EXPORTÉ
// ============================================

/**
 * Détecte l'exécution sous test (Vitest, Jest) en plus de NODE_ENV.
 * Sous Prisma 7, instancier `new PrismaClient()` sans driver adapter lève une
 * erreur : en test on veut donc toujours le stub, même si NODE_ENV n'est pas
 * propagé jusqu'au worker.
 */
function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    typeof process.env.VITEST_WORKER_ID !== 'undefined' ||
    typeof process.env.JEST_WORKER_ID !== 'undefined'
  );
}

export const prisma = isTestEnvironment()
  ? createTestStub()
  : createRealClient();

// ============================================
// 5. OPTIMISATION DB
// ============================================

export async function ensureDbOptimized() {
  if (isTestEnvironment()) {
    return;
  }

  try {
    await prisma.$executeRaw`SET statement_timeout = '30s'`;

    await prisma.$executeRaw`
      SET idle_in_transaction_session_timeout = '60s'
    `;

    const result = await prisma.$queryRaw`
      SELECT version()
    `;

    console.log('[DB] PostgreSQL version:', result);
    console.log('[DB] Optimizations applied');
  } catch (error) {
    console.error('[DB] Optimization failed:', error);
  }
}

// ============================================
// 6. DÉCONNEXION
// ============================================

export async function disconnectPrisma() {
  if (!prisma || typeof prisma.$disconnect !== 'function') {
    return;
  }

  try {
    await prisma.$disconnect();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[DB] Disconnect failed:', error);
    }
  }
}

// ============================================
// 7. CYCLE DE VIE
// ============================================

if (!isTestEnvironment()) {
  prisma.$connect().catch((error: unknown) => {
    console.error('[DB] Connection failed:', error);
  });

  process.on('beforeExit', () => {
    void disconnectPrisma();
  });
}

// ============================================
// 8. EXPORT PAR DÉFAUT
// ============================================

export default prisma;
