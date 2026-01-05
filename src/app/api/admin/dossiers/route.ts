import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/dossiers
 * Récupère tous les dossiers du tenant (pour avocats)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux avocats' }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    // Récupérer tous les dossiers du tenant
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    });

    // Transformer pour correspondre à l'interface attendue
    return NextResponse.json({ 
      dossiers: dossiers.map(d => ({
        ...d,
        numeroDossier: d.numero,
        objetDemande: d.objet,
        client: {
          nom: d.client.lastName,
          prenom: d.client.firstName,
          email: d.client.email,
        },
        dateCreation: d.dateCreation,
      }))
    });
  } catch (error) {
    console.error('Erreur récupération dossiers admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/dossiers
 * Créer un nouveau dossier (avocat pour un client)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'AVOCAT' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux avocats' }, { status: 403 });
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, typeDossier, objetDemande, priorite, dateEcheance, notes } = body;

    // Vérifier que le client appartient au tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé ou accès refusé' }, { status: 404 });
    }

    // Générer le numéro de dossier
    const year = new Date().getFullYear();
    const count = await prisma.dossier.count({
      where: { tenantId },
    });
    const numero = `D-${year}-${String(count + 1).padStart(3, '0')}`;

    // Mapper les priorités et statuts au format DB
    const prioriteMap: Record<string, string> = {
      'NORMALE': 'normale',
      'HAUTE': 'haute',
      'URGENTE': 'haute',
      'CRITIQUE': 'critique',
    };

    const statutMap: Record<string, string> = {
      'BROUILLON': 'en_cours',
      'EN_COURS': 'en_cours',
      'EN_ATTENTE': 'en_attente',
      'TERMINE': 'termine',
      'REJETE': 'termine',
      'ANNULE': 'archive',
    };

    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        numero,
        typeDossier,
        objet: objetDemande,
        priorite: prioriteMap[priorite || 'NORMALE'] || 'normale',
        statut: statutMap[body.statut || 'EN_COURS'] || 'en_cours',
        dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
        notes: notes || '',
        tenantId,
        clientId,
        dateCreation: new Date(),
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      dossier: {
        ...dossier,
        numeroDossier: dossier.numero,
        objetDemande: dossier.objet,
        client: {
          nom: dossier.client.lastName,
          prenom: dossier.client.firstName,
          email: dossier.client.email,
        },
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur création dossier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
