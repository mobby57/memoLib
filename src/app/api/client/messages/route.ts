import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// GET: Recuperer les messages
export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    // Recuperer les messages du client
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
    logger.error('Erreur recuperation messages client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST: Envoyer un message
export async function POST(request: NextRequest) {
  try {
    const { user } = await auth();

    if (!user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = user.id;
    const userRole = user.role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Le message ne peut pas etre vide' }, { status: 400 });
    }

    // Trouver l'avocat du client (premier ADMIN du tenant)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    if (!dbUser?.tenantId) {
      return NextResponse.json({ error: 'Client non associe a un tenant' }, { status: 400 });
    }

    const avocat = await prisma.user.findFirst({
      where: {
        tenantId: dbUser.tenantId,
        role: 'ADMIN',
      },
    });

    if (!avocat) {
      return NextResponse.json({ error: 'Aucun avocat trouve' }, { status: 404 });
    }

    // Creer le message
    const message = await prisma.message.create({
      data: {
        subject: 'Message client',
        content: content.trim(),
        senderId: userId,
        recipientId: avocat.id,
        tenantId: dbUser.tenantId,
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

    logger.info(`Client ${userId} a envoye un message a ${avocat.id}`);

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
  }
}
