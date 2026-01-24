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

    // Recuperer les factures des dossiers du client
    const clientDossiers = await prisma.dossier.findMany({
      where: { clientId: userId },
      select: { id: true },
    });

    const dossierIds = clientDossiers.map(d => d.id);

    const factures = await prisma.facture.findMany({
      where: {
        dossierId: {
          in: dossierIds,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        dossier: {
          select: {
            numero: true,
          },
        },
      },
    });

    return NextResponse.json(factures);
  } catch (error) {
    logger.error('Erreur recuperation factures client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
