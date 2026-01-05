import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma Client
 * 
 * Évite les multiples instances de PrismaClient en développement (hot reload)
 * En production, une seule instance est créée
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Fonction utilitaire pour fermer la connexion Prisma
 * (utilisé dans les tests ou lors de l'arrêt de l'application)
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
