import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Récupérer les factures des dossiers du client
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
    logger.error('Erreur récupération factures client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
