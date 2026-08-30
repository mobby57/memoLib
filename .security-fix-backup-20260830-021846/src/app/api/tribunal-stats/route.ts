import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/tribunal-stats
 * Retourne les taux de succès anonymisés par juridiction et type de dossier.
 * Données agrégées cross-tenant — aucune donnée individuelle exposée.
 * Minimum 5 dossiers par catégorie pour éviter la ré-identification.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const juridiction = req.nextUrl.searchParams.get('juridiction');
  const typeDossier = req.nextUrl.searchParams.get('typeDossier');
  const typeRecours = req.nextUrl.searchParams.get('typeRecours');

  const where: any = {
    outcome: { not: null },
  };
  if (juridiction) where.juridiction = juridiction;
  if (typeDossier) where.typeDossier = typeDossier;
  if (typeRecours) where.typeRecours = typeRecours;

  // Agrégation par juridiction
  const byJuridiction = await prisma.dossier.groupBy({
    by: ['juridiction', 'outcome'],
    where: { ...where, juridiction: { not: null } },
    _count: true,
  });

  // Agrégation par type de dossier
  const byType = await prisma.dossier.groupBy({
    by: ['typeDossier', 'outcome'],
    where,
    _count: true,
  });

  // Agrégation par type de recours
  const byRecours = await prisma.dossier.groupBy({
    by: ['typeRecours', 'outcome'],
    where: { ...where, typeRecours: { not: null } },
    _count: true,
  });

  // Transformer en taux de succès (minimum 5 dossiers pour anonymisation)
  const MIN_SAMPLE = 5;

  const computeStats = (groups: any[], key: string) => {
    const map: Record<string, { favorable: number; defavorable: number; total: number }> = {};

    for (const g of groups) {
      const name = g[key] || 'Inconnu';
      if (!map[name]) map[name] = { favorable: 0, defavorable: 0, total: 0 };
      map[name].total += g._count;
      if (g.outcome === 'favorable') map[name].favorable += g._count;
      else if (g.outcome === 'defavorable') map[name].defavorable += g._count;
    }

    return Object.entries(map)
      .filter(([, v]) => v.total >= MIN_SAMPLE)
      .map(([name, v]) => ({
        name,
        tauxSucces: Math.round((v.favorable / v.total) * 100),
        total: v.total,
        favorable: v.favorable,
        defavorable: v.defavorable,
      }))
      .sort((a, b) => b.tauxSucces - a.tauxSucces);
  };

  const stats = {
    parJuridiction: computeStats(byJuridiction, 'juridiction'),
    parTypeDossier: computeStats(byType, 'typeDossier'),
    parTypeRecours: computeStats(byRecours, 'typeRecours'),
    metadata: {
      minSample: MIN_SAMPLE,
      lastUpdated: new Date().toISOString(),
      note: 'Données anonymisées et agrégées. Minimum 5 dossiers par catégorie.',
    },
  };

  return NextResponse.json(stats);
}
