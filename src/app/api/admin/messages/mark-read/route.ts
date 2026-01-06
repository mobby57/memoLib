import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST mark messages as read for a specific client
export async function POST(request: NextRequest) {
  try {
    // TODO: Modèle Message n'existe pas encore
    return NextResponse.json({ success: true });
    
    /* DISABLED
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID requis' }, { status: 400 });
    }

    // Mark all messages from this client as read
    await prisma.message.updateMany({
      where: {
        expediteurId: clientId,
        destinataireId: session.user.id,
        lu: false,
      },
      data: {
        lu: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
