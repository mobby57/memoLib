import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/dossiers/:dossierId/messages
 * List messages in a dossier
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { dossierId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    // Verify dossier access
    const dossier = await prisma.dossier.findFirst({
      where: { id: params.dossierId, tenantId: user.tenantId },
    });

    if (!dossier) {
      return NextResponse.json({ error: 'Dossier not found' }, { status: 404 });
    }

    const messages = await prisma.channelMessage.findMany({
      where: { dossierId: params.dossierId },
      include: { client: true },
      orderBy: { receivedAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({ data: messages });
  } catch (error) {
    console.error('[GET /api/v1/dossiers/:dossierId/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/dossiers/:dossierId/messages
 * Create a message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { dossierId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const body = await req.json();
    const { channel, body: messageBody, clientId } = body;

    if (!channel || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create channel message
    const message = await prisma.channelMessage.create({
      data: {
        tenantId: user.tenantId,
        dossierId: params.dossierId,
        clientId: clientId || null,
        channel: channel || 'INTERNAL',
        body: messageBody,
        direction: 'OUTBOUND',
        status: 'PROCESSED',
        senderData: { email: user.email, name: user.name },
        checksum: Buffer.from(`${user.id}-${Date.now()}-${messageBody}`).toString('base64'),
      },
    });

    // Notify
    if (clientId) {
      await prisma.notification.create({
        data: {
          userId: clientId,
          type: 'message_received',
          title: 'Nouveau message',
          message: `Vous avez reçu un message concernant le dossier ${params.dossierId}`,
          data: JSON.stringify({ dossierId: params.dossierId, messageId: message.id }),
        },
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/dossiers/:dossierId/messages]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
