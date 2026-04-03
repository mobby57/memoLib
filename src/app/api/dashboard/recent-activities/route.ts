import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from '@/lib/auth/server-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;
    const clientId = (session.user as any).clientId;

    const activities: any[] = [];

    // Dossiers recents
    const dossiersWhere: any = {};
    if (userRole === 'CLIENT' && clientId) {
      dossiersWhere.clientId = clientId;
    } else if (tenantId) {
      dossiersWhere.tenantId = tenantId;
    }

    const recentDossiers = await prisma.dossier.findMany({
      where: dossiersWhere,
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    for (const dossier of recentDossiers) {
      activities.push({
        id: `dossier-${dossier.id}`,
        type: 'dossier',
        title: `${dossier.numero} - ${dossier.client?.firstName} ${dossier.client?.lastName}`,
        date: dossier.createdAt.toISOString(),
        status: dossier.statut === 'en_cours' ? 'info' :
                dossier.statut === 'clos' ? 'success' : 'warning',
      });
    }

    // Factures recentes
    const facturesWhere: any = {};
    if (userRole === 'CLIENT' && clientId) {
      facturesWhere.clientId = clientId;
    } else if (tenantId) {
      facturesWhere.tenantId = tenantId;
    }

    const recentFactures = await prisma.facture.findMany({
      where: facturesWhere,
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    for (const facture of recentFactures) {
      activities.push({
        id: `facture-${facture.id}`,
        type: 'facture',
        title: `Facture #${facture.numero} - ${facture.montantTTC}\u20AC`,
        date: facture.createdAt.toISOString(),
        status: facture.statut === 'payee' ? 'success' :
                facture.statut === 'brouillon' ? 'warning' : 'info',
      });
    }

    // Clients recents (staff only)
    if (userRole !== 'CLIENT' && tenantId) {
      const recentClients = await prisma.client.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 2,
      });

      for (const client of recentClients) {
        activities.push({
          id: `client-${client.id}`,
          type: 'client',
          title: `Nouveau client - ${client.firstName} ${client.lastName}`,
          date: client.createdAt.toISOString(),
          status: 'success',
        });
      }
    }

    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(activities.slice(0, 5));
  } catch (error) {
    logger.error('Erreur recuperation activites recentes', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
