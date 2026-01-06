import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // LIMITE: Seulement 5 dernières activités de chaque type
    const LIMIT = 5;
    const activities: any[] = [];

    // 5 derniers dossiers (au lieu de tous)
    const recentDossiers = await prisma.dossier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        titre: true,
        createdAt: true,
        statut: true
      }
    });

    recentDossiers.forEach(dossier => {
      activities.push({
        id: `dossier-${dossier.id}`,
        type: 'dossier',
        title: `Nouveau dossier: ${dossier.titre}`,
        date: dossier.createdAt.toISOString(),
        status: dossier.statut === 'en_cours' ? 'success' : 'info'
      });
    });

    // 5 dernières factures (au lieu de toutes)
    const recentFactures = await prisma.facture.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        numero: true,
        createdAt: true,
        statut: true,
        montant: true
      }
    });

    recentFactures.forEach(facture => {
      activities.push({
        id: `facture-${facture.id}`,
        type: 'facture',
        title: `Facture ${facture.numero} - ${facture.montant}€`,
        date: facture.createdAt.toISOString(),
        status: facture.statut === 'en_retard' ? 'warning' : 'info'
      });
    });

    // 5 derniers clients (au lieu de tous)
    const recentClients = await prisma.client.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        nom: true,
        prenom: true,
        createdAt: true
      }
    });

    recentClients.forEach(client => {
      activities.push({
        id: `client-${client.id}`,
        type: 'client',
        title: `Nouveau client: ${client.prenom} ${client.nom}`,
        date: client.createdAt.toISOString(),
        status: 'success'
      });
    });

    // Trier par date décroissante et limiter à 10 activités max
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedActivities = activities.slice(0, 10);

    return NextResponse.json(limitedActivities);

  } catch (error) {
    logger.error('Erreur API recent activities', { error, tenantId: params.tenantId });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
