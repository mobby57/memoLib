import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const MonthlyDataQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(12).default(6),
});

// ============================================
// GET /api/dashboard/monthly-data
// Recupere les donnees mensuelles (dossiers, factures, revenus)
// ============================================

export const GET = withAuth(['ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { session }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const { months } = MonthlyDataQuerySchema.parse({
      months: searchParams.get('months'),
    });

    const tenantId = session.user.tenantId;

    logger.log(LogCategory.API, `Fetching monthly data for ${months} months`, { tenantId, months });

    // Calculer les donnees des N derniers mois
    const monthlyData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

      // Compter les dossiers crees ce mois (en parallele)
      const [dossiersCount, facturesCount, facturesSum] = await Promise.all([
        prisma.dossier.count({
          where: {
            tenantId,
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        prisma.facture.count({
          where: {
            tenantId,
            createdAt: { gte: date, lt: nextMonth },
          },
        }),
        prisma.facture.aggregate({
          where: {
            tenantId,
            createdAt: { gte: date, lt: nextMonth },
            statut: 'payee',
          },
          _sum: { montant: true },
        }),
      ]);

      monthlyData.push({
        month: monthName,
        dossiers: dossiersCount,
        factures: facturesCount,
        revenus: facturesSum._sum?.montant || 0,
      });
    }

    logger.log(LogCategory.API, ` Monthly data fetched: ${monthlyData.length} months`, {
      tenantId,
      totalDossiers: monthlyData.reduce((sum, m) => sum + m.dossiers, 0),
      totalRevenus: monthlyData.reduce((sum, m) => sum + m.revenus, 0),
    });

    return NextResponse.json({
      success: true,
      data: monthlyData,
      period: { months, from: monthlyData[0]?.month, to: monthlyData[monthlyData.length - 1]?.month },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(LogCategory.API, 'Invalid monthly data query', { error: error.errors });
      return NextResponse.json(
        { error: 'Parametres invalides', details: error.errors },
        { status: 400 }
      );
    }

    logger.error(LogCategory.API, 'Error fetching monthly data', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});
