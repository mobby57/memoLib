import { PrismaClient } from '@prisma/client';

/**
 * Compte les lignes d'une table Prisma (pour les tests).
 * Contourne un bug de @prisma/adapter-pg où .count() retourne 0 alors que des données existent.
 * Utilise findMany avec un take limité pour éviter de charger toutes les données.
 */
export async function countRows(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  where?: any
): Promise<number> {
  const items = await (prisma[model] as any).findMany({
    where,
    take: 1000, // suffisant pour les tests
  });
  return items.length;
}
