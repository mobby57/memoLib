import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (user as any).role;
    const clientId = (user as any).clientId;
    const tenantId = (user as any).tenantId;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    if (!clientId || !tenantId) {
      return NextResponse.json(
        { error: 'Compte client non provisionne' },
        { status: 403 },
      );
    }

    // Recuperer les dossiers du client, isoles par tenant
    const dossiers = await prisma.dossier.findMany({
      where: {
        clientId,
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    });

    return NextResponse.json(dossiers);
  } catch (error) {
    logger.error('Erreur recuperation dossiers client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}




