import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string; clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const { tenantId, clientId } = params;

    // Vérification d'accès
    if (user.role !== 'ADMIN' || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Récupérer les dossiers du client avec infos du client
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        clientId
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        documents: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formater les données pour le frontend
    const formattedDossiers = dossiers.map(dossier => {
      // Déterminer si les données client sont complètes
      const hasDocuments = dossier.documents.length > 0;
      const hasDescription = dossier.description && dossier.description.length > 50;
      const clientDataComplete = hasDocuments && hasDescription;

      // Calculer la progression
      let progression = 0;
      if (dossier.statut === 'en_attente') progression = 20;
      else if (dossier.statut === 'documents_requis') progression = 30;
      else if (dossier.statut === 'en_cours') progression = clientDataComplete ? 65 : 40;
      else if (dossier.statut === 'analyse_ia') progression = 80;
      else if (dossier.statut === 'termine') progression = 100;

      // Déterminer la priorité (à adapter selon vos critères)
      const daysSinceCreation = Math.floor(
        (new Date().getTime() - new Date(dossier.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const priorite = daysSinceCreation > 14 ? 'haute' : 
                       daysSinceCreation > 7 ? 'moyenne' : 'basse';

      return {
        id: dossier.id,
        numero: dossier.numero,
        titre: dossier.objet || 'Sans objet',
        type: dossier.typeDossier || 'Réclamation',
        statut: dossier.statut,
        priorite,
        progression,
        clientDataComplete,
        lastUpdate: getLastUpdateMessage(dossier, clientDataComplete),
        clientName: 'Client'
      };
    });

    return NextResponse.json({
      dossiers: formattedDossiers
    });

  } catch (error) {
    logger.error('Erreur API dossiers client', { error, params });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function getLastUpdateMessage(dossier: any, clientDataComplete: boolean): string {
  const timeSince = getTimeSince(dossier.updatedAt);
  
  if (dossier.statut === 'analyse_ia') {
    return `L'IA analyse les données fournies - ${timeSince}`;
  }
  if (!clientDataComplete) {
    return `En attente des données client - ${timeSince}`;
  }
  if (dossier.statut === 'termine') {
    return `Dossier terminé - ${timeSince}`;
  }
  
  return `Données mises à jour par le client ${timeSince}`;
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays === 1) return 'il y a 1 jour';
  return `il y a ${diffDays} jours`;
}
