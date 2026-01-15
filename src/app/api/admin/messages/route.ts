import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all conversations grouped by client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const adminId = session.user.id;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: adminId },
          { recipientId: adminId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by client
    const conversationsMap = new Map<string, any>();

    messages.forEach((msg: any) => {
      const clientUser = msg.sender.role === 'CLIENT' ? msg.sender : msg.recipient;
      const clientId = clientUser.id;

      if (!conversationsMap.has(clientId)) {
        conversationsMap.set(clientId, {
          clientId,
          clientName: clientUser.name,
          messages: [],
          unreadCount: 0,
          lastMessage: '',
          lastMessageDate: msg.createdAt,
        });
      }

      const conv = conversationsMap.get(clientId);
      conv.messages.push(msg);

      // Count unread messages from client
      if (msg.senderId === clientId && !msg.isRead) {
        conv.unreadCount++;
      }
    });

    // Convert to array and set last message
    const conversations = Array.from(conversationsMap.values()).map((conv) => {
      const lastMsg = conv.messages[0];
      conv.lastMessage = lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '');
      return conv;
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST send message to client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId, contenu } = body;

    if (!contenu || !clientId) {
      return NextResponse.json({ error: 'Contenu et client requis' }, { status: 400 });
    }

    if (!session.user.id || !session.user.tenantId) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    const message = await prisma.message.create({
      data: {
        tenantId: session.user.tenantId,
        senderId: session.user.id,
        recipientId: clientId,
        subject: 'Message de votre cabinet',
        content: contenu,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
