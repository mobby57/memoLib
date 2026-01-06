import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'IDs de messages invalides' }, { status: 400 });
    }

    // TODO: Modèle Message n'existe pas encore
    return NextResponse.json({ success: true });
    
    /* DISABLED - Modèle Message inexistant
    // Marquer les messages comme lus
    await prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        recipientId: userId,
      },
      data: {
        read: true,
      },
    });

    logger.info(`Client ${userId} a marqué ${messageIds.length} messages comme lus`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur marquage messages lus', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
