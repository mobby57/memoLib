import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { logger, LogCategory } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const RecentActivitiesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ============================================
// GET /api/dashboard/recent-activities
// Recupere les activites recentes (multi-role)
// ============================================

export const GET = withAuth(['CLIENT', 'ADMIN', 'SUPER_ADMIN'], async (
  request: NextRequest,
  { session }
) => {
  try {
    const { searchParams } = new URL(request.url);
    const { limit } = RecentActivitiesQuerySchema.parse({
      limit: searchParams.get('limit'),
    });

    const userId = session.user.id;
    const userRole = session.user.role;
    const tenantId = session.user.tenantId;

    logger.log(LogCategory.API, `Fetching recent activities`, { userId, role: userRole, limit });

    const activities: any[] = [];

    // Determiner les filtres selon le role
    let dossiersWhere: any = {};
    let facturesWhere: any = {};

    if (userRole === 'CLIENT') {
      dossiersWhere = { clientId: userId };
      const clientDossiers = await prisma.dossier.findMany({
        where: { clientId: userId },
        select: { id: true },
      });
      facturesWhere = { dossierId: { in: clientDossiers.map(d => d.id) } };
    } else if (userRole === 'ADMIN' && tenantId) {
      dossiersWhere = { tenantId };
      facturesWhere = { tenantId };
    } else if (userRole === 'SUPER_ADMIN') {
      // SUPER_ADMIN voit tout (optionnel - a adapter)
      dossiersWhere = {};
      facturesWhere = {};
    }

    // Recuperer dossiers et factures en parallele
    const dossiersLimit = Math.ceil(limit * 0.6); // 60% dossiers
    const facturesLimit = Math.floor(limit * 0.4); // 40% factures

    const [recentDossiers, recentFactures] = await Promise.all([
      prisma.dossier.findMany({
        where: dossiersWhere,
        orderBy: { createdAt: 'desc' },
        take: dossiersLimit,
        include: {
          client: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.facture.findMany({
        where: facturesWhere,
        orderBy: { createdAt: 'desc' },
        take: facturesLimit,
      }),
    ]);

    // Formater les dossiers
    for (const dossier of recentDossiers) {
      activities.push({
        id: `dossier-${dossier.id}`,
        type: 'dossier',
        title: `${dossier.numero} - ${dossier.client?.firstName || ''} ${dossier.client?.lastName || ''}`.trim(),
        date: dossier.createdAt.toISOString(),
        status: dossier.statut === 'en_cours' ? 'info' : 
                dossier.statut === 'termine' ? 'success' : 'warning',
      });
    }

    // Formater les factures
    for (const facture of recentFactures) {
      activities.push({
        id: `facture-${facture.id}`,
        type: 'facture',
        title: `Facture #${facture.numero} - ${facture.montant}€`,
        date: facture.createdAt.toISOString(),
        status: facture.statut === 'payee' ? 'success' : 
                facture.statut === 'en_attente' ? 'warning' : 'info',
      });
    }

    // Trier par date decroissante et limiter
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, limit);

    logger.log(LogCategory.API, ` Recent activities fetched: ${limitedActivities.length}`, {
      userId,
      dossiers: recentDossiers.length,
      factures: recentFactures.length,
    });

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: limitedActivities.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(LogCategory.API, 'Invalid activities query', { error: error.errors });
      return NextResponse.json(
        { error: 'Parametres invalides', details: error.errors },
        { status: 400 }
      );
    }

    logger.error(LogCategory.API, 'Error fetching activities', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
});
