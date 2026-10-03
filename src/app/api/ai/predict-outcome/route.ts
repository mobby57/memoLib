import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';
import { z } from 'zod';

/**
 * POST /api/ai/predict-outcome
 * Estime les chances de succes basees sur les stats tribunal anonymisees.
 */
const predictionSchema = z.object({
  typeDossier: z.string().trim().min(1).max(100).optional(),
  juridiction: z.string().trim().min(1).max(200).optional(),
  typeRecours: z.string().trim().min(1).max(100).optional(),
}).strict();

export const POST = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const parsed = predictionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Requête de prédiction invalide' }, { status: 400 });
  const { typeDossier, juridiction, typeRecours } = parsed.data;

  // Recuperer les stats anonymisees
  const where = { tenantId: user.tenantId, outcome: { not: null }, typeDossier, juridiction, typeRecours };

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
});
