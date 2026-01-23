import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    const totalDossiers = await prisma.dossier.count({
      where: { tenantId },
    });

    const dossiersActifs = await prisma.dossier.count({
      where: { tenantId, statut: 'EN_COURS' },
    });

    const dossiersEnAttente = await prisma.dossier.count({
      where: { tenantId, statut: 'EN_ATTENTE' },
    });

    const dossiersTermines = await prisma.dossier.count({
      where: { tenantId, statut: 'TERMINE' },
    });

    const dossiersArchives = await prisma.dossier.count({
      where: { tenantId, statut: 'ARCHIVE' },
    });

    const facturesEnAttente = await prisma.facture.count({
      where: { tenantId, statut: 'EN_ATTENTE' },
    });

    const revenusData = await prisma.facture.aggregate({
      where: { tenantId, statut: 'PAYEE' },
      _sum: { montant: true },
    });

    const revenus = revenusData._sum?.montant || 0;

    const stats = {
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
    };

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Erreur API dashboard stats', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
