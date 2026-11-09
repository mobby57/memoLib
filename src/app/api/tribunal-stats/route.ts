import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;

/**
 * GET /api/tribunal-stats
 * Retourne les taux de succÃ¨s anonymisÃ©s par juridiction et type de dossier.
 * DonnÃ©es agrÃ©gÃ©es cross-tenant â€” aucune donnÃ©e individuelle exposÃ©e.
 * Minimum 5 dossiers par catÃ©gorie pour Ã©viter la rÃ©-identification.
 */
export async function GET(req: NextRequest) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
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

  // AgrÃ©gation par juridiction
  const byJuridiction = await prisma.dossier.groupBy({
    by: ['juridiction', 'outcome'],
    where: { ...where, juridiction: { not: null } },
    _count: true,
  });

  // AgrÃ©gation par type de dossier
  const byType = await prisma.dossier.groupBy({
    by: ['typeDossier', 'outcome'],
    where,
    _count: true,
  });

  // AgrÃ©gation par type de recours
  const byRecours = await prisma.dossier.groupBy({
    by: ['typeRecours', 'outcome'],
    where: { ...where, typeRecours: { not: null } },
    _count: true,
  });

  // Transformer en taux de succÃ¨s (minimum 5 dossiers pour anonymisation)
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
      note: 'DonnÃ©es anonymisÃ©es et agrÃ©gÃ©es. Minimum 5 dossiers par catÃ©gorie.',
    },
  };

  return NextResponse.json(stats);
}

