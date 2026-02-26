import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    const dossierId = params.id;

    // Recuperer le dossier avec ses relations
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        clientId: userId, // Securite: le client ne peut voir que ses propres dossiers
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
        { error: 'Dossier non trouve ou acces refuse' },
        { status: 404 }
      );
    }

    logger.info(`Client ${userId} a consulte le dossier ${dossierId}`);

    return NextResponse.json(dossier);
  } catch (error) {
    logger.error('Erreur recuperation details dossier client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
