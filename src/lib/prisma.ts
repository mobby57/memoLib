// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';

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
  const client = new PrismaClient({
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

// Pattern singleton + instanciation PARESSEUSE via Proxy.
//
// Pourquoi lazy : importer `prisma` ne doit PAS construire un PrismaClient.
// Sinon, la simple présence de `import { prisma } from '@/lib/prisma'` (ex. dans
// clerk-auth, importé par ~200 routes) instancie le client au chargement du
// module, ce qui échoue pendant la collecte page-data de `next build`
// (new PrismaClient() throw sans contexte moteur/DB au build).
//
// Le client réel n'est construit qu'au PREMIER accès à une propriété
// (première requête au runtime). Le stub de test reste inchangé.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (process.env.NODE_ENV === 'test') {
    return (globalForPrisma.prisma ??= createTestStub());
  }
  return (globalForPrisma.prisma ??= createRealClient());
}

// Type volontairement `any` : c'était déjà le type effectif de `prisma`
// auparavant (union `createTestStub(): any | PrismaClient` => `any`). On le
// conserve pour NE PAS introduire une vague d'erreurs de typage pré-existantes
// (usages de $transaction, etc. masqués jusqu'ici). Le seul objectif ici est
// l'instanciation paresseuse pour débloquer `next build`.
const lazyPrisma: any = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const client = getClient();
      const value = Reflect.get(client as object, prop, receiver);
      return typeof value === 'function' ? value.bind(client) : value;
    },
    has(_target, prop) {
      return prop in getClient();
    },
  }
);

export const prisma = lazyPrisma;

// ============================================
// 5. OPTIMISATION DB
// ============================================

export async function ensureDbOptimized() {
  if (process.env.NODE_ENV === 'test') {
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
  // N'accède au client que s'il a réellement été instancié (évite de le créer
  // juste pour le déconnecter, ce qui déclencherait le Proxy inutilement).
  const client = globalForPrisma.prisma;
  if (!client || typeof client.$disconnect !== 'function') {
    return;
  }

  try {
    await client.$disconnect();
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[DB] Disconnect failed:', error);
    }
  }
}

// ============================================
// 7. CYCLE DE VIE
// ============================================

// NB: pas de prisma.$connect() au niveau module. Prisma se connecte
// paresseusement à la première requête. Un connect impatient ici casserait la
// collecte page-data de `next build` (échec de connexion DB au build) et
// n'apporte rien en serverless. On conserve uniquement une déconnexion propre.
if (process.env.NODE_ENV !== 'test') {
  process.on('beforeExit', () => {
    void disconnectPrisma();
  });
}

// ============================================
// 8. EXPORT PAR DÉFAUT
// ============================================

export default prisma;
