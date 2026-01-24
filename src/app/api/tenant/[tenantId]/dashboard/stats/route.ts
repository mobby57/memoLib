import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const { tenantId } = params;

    // Vérifications d'accès
    if (user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    if (user.role === 'ADMIN' && user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès interdit - Mauvais tenant' }, { status: 403 });
    }

    // Statistiques du tenant
    const [
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus
    ] = await Promise.all([
      prisma.dossier.count({ where: { tenantId } }),
      prisma.dossier.count({ where: { tenantId, statut: 'en_cours' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'en_attente' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'termine' } }),
      prisma.dossier.count({ where: { tenantId, statut: 'archive' } }),
      prisma.facture.count({ where: { tenantId, statut: 'en_attente' } }),
      prisma.facture.aggregate({
        where: { tenantId, statut: 'payee' },
        _sum: { montant: true }
      })
    ]);

    return NextResponse.json({
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus: revenus._sum.montant || 0,
      trends: {
        dossiers: 5,
        factures: 2,
        revenus: 5.2
      }
    });

  } catch (error) {
    logger.error('Erreur API tenant stats', { error, tenantId: params.tenantId });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}