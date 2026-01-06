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

    // Get all messages involving this admin
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { expediteurId: adminId },
          { destinataireId: adminId },
        ],
      },
      include: {
        expediteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        destinataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        dateEnvoi: 'desc',
      },
    });

    // Group by client
    const conversationsMap = new Map<string, any>();

    messages.forEach((msg) => {
      const clientUser = msg.expediteur.role === 'CLIENT' ? msg.expediteur : msg.destinataire;
      const clientId = clientUser.id;

      if (!conversationsMap.has(clientId)) {
        conversationsMap.set(clientId, {
          clientId,
          clientName: `${clientUser.firstName} ${clientUser.lastName}`,
          messages: [],
          unreadCount: 0,
          lastMessage: '',
          lastMessageDate: msg.dateEnvoi,
        });
      }

      const conv = conversationsMap.get(clientId);
      conv.messages.push(msg);

      // Count unread messages from client
      if (msg.expediteurId === clientId && !msg.lu) {
        conv.unreadCount++;
      }
    });

    // Convert to array and set last message
    const conversations = Array.from(conversationsMap.values()).map((conv) => {
      const lastMsg = conv.messages[0];
      conv.lastMessage = lastMsg.contenu.substring(0, 50) + (lastMsg.contenu.length > 50 ? '...' : '');
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

    const message = await prisma.message.create({
      data: {
        expediteurId: session.user.id,
        destinataireId: clientId,
        contenu,
        lu: false,
        dateEnvoi: new Date(),
      },
      include: {
        expediteur: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        destinataire: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
