import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Recuperer tous les documents du client
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { uploadedBy: userId },
          {
            dossier: {
              clientId: userId,
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dossier: {
          select: {
            id: true,
            numero: true,
            typeDossier: true,
          },
        },
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    logger.error('Erreur recuperation documents client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
