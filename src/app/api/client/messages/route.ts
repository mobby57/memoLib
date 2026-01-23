import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Récupérer les messages
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

    // Récupérer les messages du client
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { recipientId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName: msg.sender.name,
      senderRole: msg.sender.role,
      createdAt: msg.createdAt,
      read: msg.isRead,
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    logger.error('Erreur récupération messages client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Envoyer un message
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
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Le message ne peut pas être vide' }, { status: 400 });
    }

    // Trouver l'avocat du client (premier ADMIN du tenant)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Client non associé à un tenant' }, { status: 400 });
    }

    const avocat = await prisma.user.findFirst({
      where: {
        tenantId: user.tenantId,
        role: 'ADMIN',
      },
    });

    if (!avocat) {
      return NextResponse.json({ error: 'Aucun avocat trouvé' }, { status: 404 });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        subject: 'Message client',
        content: content.trim(),
        senderId: userId,
        recipientId: avocat.id,
        tenantId: user.tenantId,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    logger.info(`Client ${userId} a envoyé un message à ${avocat.id}`);

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderName: message.sender.name,
        senderRole: message.sender.role,
        createdAt: message.createdAt,
        read: message.isRead,
      },
    });
  } catch (error) {
    logger.error('Erreur envoi message client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'envoi' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
