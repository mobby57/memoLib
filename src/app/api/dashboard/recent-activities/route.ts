import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autoris�' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    const activities: any[] = [];

    // R�cup�rer les dossiers r�cents
    let dossiersWhere: any = {};
    if (userRole === 'CLIENT') {
      dossiersWhere = { clientId: userId };
    } else if (userRole === 'AVOCAT' && tenantId) {
      dossiersWhere = { tenantId };
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
        status: dossier.statut === 'EN_COURS' ? 'info' : 
                dossier.statut === 'TERMINE' ? 'success' : 'warning',
      });
    }

    // R�cup�rer les factures r�centes
    let facturesWhere: any = {};
    if (userRole === 'CLIENT') {
      const clientDossiers = await prisma.dossier.findMany({
        where: { clientId: userId },
        select: { id: true },
      });
      facturesWhere = {
        dossierId: { in: clientDossiers.map(d => d.id) },
      };
    } else if (userRole === 'AVOCAT' && tenantId) {
      facturesWhere = { tenantId };
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
        title: `Facture #${facture.numero} - ${facture.montant}�`,
        date: facture.createdAt.toISOString(),
        status: facture.statut === 'PAYEE' ? 'success' : 
                facture.statut === 'EN_ATTENTE' ? 'warning' : 'info',
      });
    }

    // R�cup�rer les clients r�cents (seulement pour avocats)
    if (userRole === 'AVOCAT' && tenantId) {
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

    // Trier toutes les activit�s par date d�croissante
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Limiter � 5 activit�s
    const finalActivities = activities.slice(0, 5);

    return NextResponse.json(finalActivities);
  } catch (error) {
    console.error('Erreur lors de la r�cup�ration des activit�s r�centes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
