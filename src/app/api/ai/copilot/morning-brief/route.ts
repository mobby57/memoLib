import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/middleware/rate-limit';

/**
 * GET /api/ai/copilot/morning-brief
 * Morning Brief CESEDA — Résumé du jour pour l'avocat
 */
export const GET = withAIRateLimit(async (req: NextRequest) => {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 86400000);

  // Dossiers à risque (OQTF avec deadlines proches)
  const dossiersAtRisk = await prisma.dossier.findMany({
    where: {
      tenantId: user.tenantId,
      statut: { not: 'cloture' },
      legalDeadlines: { some: { status: 'PENDING', dueDate: { lte: in7days, gte: now } } },
    },
    select: { id: true, numero: true, typeDossier: true, legalDeadlines: { where: { status: 'PENDING', dueDate: { lte: in7days } }, select: { label: true, dueDate: true } } },
    take: 10,
  });

  // Dossiers incomplets
  const dossiersIncomplete = await prisma.dossier.count({
    where: { tenantId: user.tenantId, statut: { not: 'cloture' }, checklistComplete: false, checklistTotal: { gt: 0 } },
  });

  // Délais critiques (< 3 jours)
  const in3days = new Date(now.getTime() + 3 * 86400000);
  const criticalDeadlines = await prisma.legalDeadline.findMany({
    where: { dossier: { tenantId: user.tenantId }, status: 'PENDING', dueDate: { lte: in3days, gte: now } },
    include: { dossier: { select: { numero: true, typeDossier: true } } },
    take: 5,
  });

  // Relances recommandées (dossiers en attente client > 5 jours sans email)
  const fiveDaysAgo = new Date(now.getTime() - 5 * 86400000);
  const pendingDossiers = await prisma.dossier.count({
    where: {
      tenantId: user.tenantId,
      statut: 'en_cours',
      checklistComplete: false,
      emails: { none: { receivedDate: { gte: fiveDaysAgo } } },
    },
  });

  return NextResponse.json({
    date: now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    dossiersAtRisk: dossiersAtRisk.map(d => ({
      numero: d.numero,
      type: d.typeDossier,
      deadlines: d.legalDeadlines.map(dl => ({
        label: dl.label,
        daysRemaining: Math.ceil((new Date(dl.dueDate).getTime() - now.getTime()) / 86400000),
      })),
    })),
    stats: {
      oqtfAtRisk: dossiersAtRisk.filter(d => d.typeDossier.includes('OQTF')).length,
      incomplete: dossiersIncomplete,
      criticalDeadlines: criticalDeadlines.length,
      relancesRecommandees: pendingDossiers,
    },
    criticalDeadlines: criticalDeadlines.map(dl => ({
      dossier: dl.dossier.numero,
      type: dl.dossier.typeDossier,
      label: dl.label,
      daysRemaining: Math.ceil((new Date(dl.dueDate).getTime() - now.getTime()) / 86400000),
    })),
  });
});


