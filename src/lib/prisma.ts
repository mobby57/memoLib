import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Client Prisma non sécurisé (pour migrations/seeds)
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Client Prisma sécurisé par RLS (Row-Level Security)
export async function getSecurePrisma() {
  const { userId, orgId } = await auth();

  // Si pas d'utilisateur ou pas d'organisation (tenant), on bloque net.
  if (!userId || !orgId) {
    throw new Error("Accès refusé : Aucun cabinet (tenant) associé à cette session.");
  }

  const baseClient = globalForPrisma.prisma || new PrismaClient();

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Injection du tenantId dans la session PostgreSQL
          await baseClient.$executeRawUnsafe(`SET LOCAL app.current_tenant = '${orgId}';`);
          return query(args);
        },
      },
    },
  });
}
