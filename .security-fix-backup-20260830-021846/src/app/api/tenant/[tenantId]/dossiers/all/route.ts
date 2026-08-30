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

    // Seuls les ADMIN peuvent voir tous les dossiers
    if (user.role !== 'ADMIN' || user.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    // Récupérer TOUS les dossiers du tenant avec les infos client
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId
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
        updatedAt: 'desc'
      },
      take: 100 // Limite pour performance
    });

    // Formater les données
    const formattedDossiers = dossiers.map(dossier => {
      const hasDocuments = dossier.documents.length > 0;
      const hasDescription = dossier.description && dossier.description.length > 50;
      const clientDataComplete = hasDocuments && hasDescription;

      let progression = 0;
      if (dossier.statut === 'en_attente') progression = 20;
      else if (dossier.statut === 'documents_requis') progression = 30;
      else if (dossier.statut === 'en_cours') progression = clientDataComplete ? 65 : 40;
      else if (dossier.statut === 'analyse_ia') progression = 80;
      else if (dossier.statut === 'termine') progression = 100;

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
        lastUpdate: getTimeSince(dossier.updatedAt),
        clientName: `${dossier.client?.firstName || ''} ${dossier.client?.lastName || ''}`.trim() || 'Client inconnu'
      };
    });

    return NextResponse.json({
      dossiers: formattedDossiers
    });

  } catch (error) {
    logger.error('Erreur API tous dossiers', { error, tenantId: params.tenantId });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Il y a 1 jour';
  return `Il y a ${diffDays} jours`;
}
