import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;
    const { clientId } = params;

    // Verifications d'acces - Seul le client peut acceder a ses donnees
    if (user.role !== 'CLIENT' || user.clientId !== clientId) {
      return NextResponse.json({ error: 'Acces interdit' }, { status: 403 });
    }

    // Recuperer les informations du client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        dossiers: {
          select: {
            id: true,
            numero: true,
            typeDossier: true,
            statut: true,
            priorite: true,
            dateCreation: true,
            dateEcheance: true,
            description: true
          },
          take: 1 // Un client n'a generalement qu'un dossier principal
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non trouve' }, { status: 404 });
    }

    // Recuperer les factures du client
    const factures = await prisma.facture.findMany({
      where: {
        tenantId: client.tenantId,
        clientName: `${client.firstName} ${client.lastName}`
      },
      select: {
        id: true,
        montant: true,
        statut: true,
        dateEcheance: true
      }
    });

    // Calculer les statistiques des factures
    const facturesStats = {
      total: factures.length,
      payees: factures.filter(f => f.statut === 'payee').length,
      enAttente: factures.filter(f => f.statut === 'en_attente').length,
      enRetard: factures.filter(f => {
        return f.statut === 'en_attente' && 
               new Date(f.dateEcheance) < new Date();
      }).length,
      prochaine: factures
        .filter(f => f.statut === 'en_attente')
        .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime())[0]
    };

    // Recuperer les dernieres activites (simplifiees pour le client)
    const dernieresActivites = await prisma.auditLog.findMany({
      where: {
        tenantId: client.tenantId,
        objectType: 'Dossier',
        objectId: client.dossiers[0]?.id
      },
      select: {
        id: true,
        action: true,
        timestamp: true,
        objectType: true
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    return NextResponse.json({
      monDossier: client.dossiers[0] || null,
      mesFactures: facturesStats,
      dernieresActivites: dernieresActivites.map(activity => ({
        id: activity.id,
        type: activity.objectType.toLowerCase(),
        titre: `${activity.action} - ${activity.objectType}`,
        date: activity.timestamp
      }))
    });

  } catch (error) {
    console.error('Erreur API client dashboard:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}