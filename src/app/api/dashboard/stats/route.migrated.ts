import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// ============================================
// GET /api/dashboard/stats
// Recupere les statistiques globales du dashboard
// ============================================

export const GET = withAuth(['ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { session }
) => {
  try {
    const tenantId = session.user.tenantId;

    logger.log(LogCategory.API, `Fetching dashboard stats`, { tenantId });

    // Requetes en parallele pour optimiser la performance
    const [
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenusData,
    ] = await Promise.all([
      prisma.dossier.count({ where: { tenantId } }),
      prisma.dossier.count({ where: { tenantId, statut: 'en_cours' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'en_attente' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'termine' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'archive' } }),
      prisma.facture.count({ where: { tenantId, statut: 'en_attente' } }),
      prisma.facture.aggregate({
        where: { tenantId, statut: 'payee' },
        _sum: { montant: true },
      }),
    ]);

    const revenus = revenusData._sum?.montant || 0;

    // Calculer les tendances (comparaison avec le mois precedent)
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthStart = lastMonthEnd;

    const [
      lastMonthDossiers,
      currentMonthDossiers,
      lastMonthFactures,
      currentMonthFactures,
      lastMonthRevenus,
      currentMonthRevenus,
    ] = await Promise.all([
      prisma.dossier.count({ where: { tenantId, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
      prisma.dossier.count({ where: { tenantId, createdAt: { gte: currentMonthStart } } }),
      prisma.facture.count({ where: { tenantId, createdAt: { gte: lastMonthStart, lt: lastMonthEnd } } }),
      prisma.facture.count({ where: { tenantId, createdAt: { gte: currentMonthStart } } }),
      prisma.facture.aggregate({
        where: { tenantId, statut: 'payee', createdAt: { gte: lastMonthStart, lt: lastMonthEnd } },
        _sum: { montant: true },
      }),
      prisma.facture.aggregate({
        where: { tenantId, statut: 'payee', createdAt: { gte: currentMonthStart } },
        _sum: { montant: true },
      }),
    ]);

    const trends = {
      dossiers: lastMonthDossiers > 0 
        ? Math.round(((currentMonthDossiers - lastMonthDossiers) / lastMonthDossiers) * 100)
        : currentMonthDossiers > 0 ? 100 : 0,
      factures: lastMonthFactures > 0
        ? Math.round(((currentMonthFactures - lastMonthFactures) / lastMonthFactures) * 100)
        : currentMonthFactures > 0 ? 100 : 0,
      revenus: (lastMonthRevenus._sum?.montant || 0) > 0
        ? Math.round((((currentMonthRevenus._sum?.montant || 0) - (lastMonthRevenus._sum?.montant || 0)) / (lastMonthRevenus._sum?.montant || 1)) * 100)
        : (currentMonthRevenus._sum?.montant || 0) > 0 ? 100 : 0,
    };

    const stats = {
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus,
      trends,
    };

    logger.log(LogCategory.API, ` Dashboard stats fetched`, {
      tenantId,
      totalDossiers,
      revenus,
      trends,
    });

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    logger.error(LogCategory.API, 'Error fetching dashboard stats', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});
