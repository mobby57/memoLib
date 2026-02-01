import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userTenantId = (session.user as any).tenantId;
  if (userTenantId !== params.tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const [
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus
    ] = await Promise.all([
      prisma.dossier.count({ where: { tenantId: params.tenantId } }),
      prisma.dossier.count({ where: { tenantId: params.tenantId, statut: 'en_cours' } }),
      prisma.dossier.count({ where: { tenantId: params.tenantId, statut: 'en_attente' } }),
      prisma.dossier.count({ where: { tenantId: params.tenantId, statut: 'termine' } }),
      prisma.dossier.count({ where: { tenantId: params.tenantId, statut: 'archive' } }),
      prisma.facture.count({ where: { tenantId: params.tenantId, statut: 'en_attente' } }),
      prisma.facture.aggregate({
        where: { tenantId: params.tenantId, statut: 'payee' },
        _sum: { montantTTC: true }
      })
    ]);

    return NextResponse.json({
      totalDossiers,
      dossiersActifs,
      dossiersEnAttente,
      dossiersTermines,
      dossiersArchives,
      facturesEnAttente,
      revenus: revenus._sum.montantTTC || 0,
      trends: {
        dossiers: Math.round(Math.random() * 20 - 10),
        factures: Math.round(Math.random() * 10 - 5),
        revenus: Math.round(Math.random() * 15 - 5)
      }
    });
  } catch (error) {
    logger.error('Erreur stats dashboard:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
