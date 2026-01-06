import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const dossierId = params.id;

    // Récupérer le dossier avec ses relations
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        clientId: userId, // Sécurité: le client ne peut voir que ses propres dossiers
      },
      include: {
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        echeances: {
          orderBy: {
            dateEcheance: 'asc',
          },
        },
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!dossier) {
      return NextResponse.json(
        { error: 'Dossier non trouvé ou accès refusé' },
        { status: 404 }
      );
    }

    logger.info(`Client ${userId} a consulté le dossier ${dossierId}`);

    return NextResponse.json(dossier);
  } catch (error) {
    logger.error('Erreur récupération détails dossier client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
