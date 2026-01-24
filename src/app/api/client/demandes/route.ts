import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/client/demandes
 * Creer une nouvelle demande (client cree un dossier pour lui-meme)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const clientId = (session.user as any).clientId;
    const tenantId = (session.user as any).tenantId;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    if (!clientId || !tenantId) {
      return NextResponse.json({ error: 'Client ou tenant non trouve' }, { status: 403 });
    }

    const body = await request.json();
    const { typeDossier, objetDemande, priorite, dateEcheance, complementInfo } = body;

    // Generer le numero de dossier
    const year = new Date().getFullYear();
    const count = await prisma.dossier.count({
      where: { tenantId },
    });
    const numero = `D-${year}-${String(count + 1).padStart(3, '0')}`;

    // Mapper les priorites
    const prioriteMap: Record<string, string> = {
      'NORMALE': 'normale',
      'HAUTE': 'haute',
      'URGENTE': 'haute',
      'CRITIQUE': 'critique',
    };

    // Creer le dossier avec statut en_cours (demande client)
    const dossier = await prisma.dossier.create({
      data: {
        numero,
        typeDossier,
        objet: objetDemande,
        priorite: prioriteMap[priorite || 'NORMALE'] || 'normale',
        statut: 'en_cours', // Les clients creent directement en_cours
        dateEcheance: dateEcheance ? new Date(dateEcheance) : undefined,
        notes: complementInfo || '',
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

    // TODO: Envoyer notification a l'avocat
    // await sendNotificationToAvocat(tenantId, dossier)

    return NextResponse.json({ 
      dossier: {
        ...dossier,
        message: 'Votre demande a ete transmise a votre avocat',
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur creation demande client:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/client/demandes
 * Recuperer les demandes en attente du client
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const clientId = (session.user as any).clientId;

    if (userRole !== 'CLIENT' || !clientId) {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    // Recuperer les dossiers du client (demandes)
    const demandes = await prisma.dossier.findMany({
      where: {
        clientId,
      },
      orderBy: {
        dateCreation: 'desc',
      },
      include: {
        _count: {
          select: {
            documents: true,
          },
        },
      },
    });

    return NextResponse.json({ demandes });
  } catch (error) {
    console.error('Erreur recuperation demandes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
