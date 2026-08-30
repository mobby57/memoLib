import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/predict-outcome
 * Estime les chances de succes basees sur les stats tribunal anonymisees.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { typeDossier, juridiction, typeRecours } = await req.json();

  // Recuperer les stats anonymisees
  const where: any = { outcome: { not: null } };
  if (typeDossier) where.typeDossier = typeDossier;
  if (juridiction) where.juridiction = juridiction;
  if (typeRecours) where.typeRecours = typeRecours;

  const results = await prisma.dossier.groupBy({
    by: ['outcome'],
    where,
    _count: true,
  });

  const total = results.reduce((sum, r) => sum + r._count, 0);
  const favorable = results.find(r => r.outcome === 'favorable')?._count || 0;

  if (total < 5) {
    return NextResponse.json({
      prediction: null,
      message: 'Pas assez de donnees (minimum 5 dossiers similaires requis)',
      total,
    });
  }

  const tauxSucces = Math.round((favorable / total) * 100);

  return NextResponse.json({
    prediction: {
      tauxSucces,
      total,
      favorable,
      level: tauxSucces >= 70 ? 'favorable' : tauxSucces >= 40 ? 'incertain' : 'defavorable',
    },
    filters: { typeDossier, juridiction, typeRecours },
    note: 'Estimation basee sur des dossiers similaires anonymises. Ne constitue pas une garantie.',
  });
}
