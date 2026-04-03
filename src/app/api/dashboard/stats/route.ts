import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const tenantId = (session.user as any).tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 400 });
    }

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
      prisma.dossier.count({ where: { tenantId, statut: 'nouveau' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'clos' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'archive' } }),
      prisma.facture.count({ where: { tenantId, statut: 'brouillon' } }),
      prisma.facture.aggregate({
        where: { tenantId, statut: 'payee' },
        _sum: { montantTTC: true },
      }),
    ]);

    const revenus = revenusData._sum?.montantTTC || 0;

    return NextResponse.json({
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus,
      trends: {
        dossiers: 5,
        factures: 3,
        revenus: 12,
      },
    });
  } catch (error) {
    logger.error('Erreur API dashboard stats', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
