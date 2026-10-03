import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// POST mark messages as read for a specific client
export async function POST(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID requis' }, { status: 400 });
    }

    // Mark all messages from this client as read
    await prisma.message.updateMany({
      where: {
        senderId: clientId,
        recipientId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error marking messages as read:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




