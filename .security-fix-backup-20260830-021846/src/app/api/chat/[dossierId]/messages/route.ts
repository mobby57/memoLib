import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';

/**
 * GET /api/chat/[dossierId]/messages
 * Liste les messages du chat d'un dossier.
 * 
 * POST /api/chat/[dossierId]/messages
 * Envoie un message (client ou avocat).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId } = await params;
  const user = session.user as any;
  const tenantId = user.tenantId as string | undefined;
  if (!tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId,
    role: user.role,
    groups: user.groups,
    dossierId,
    action: 'read',
  });
  if (!access.allowed) {
    return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
  }

  const rows = await prisma.channelMessage.findMany({
    where: { tenantId, dossierId, channel: 'INTERNAL' },
    orderBy: { receivedAt: 'asc' },
    take: 200,
  });

  const messages = rows.map((row) => {
    const sender = (row.senderData as { id?: string; name?: string; role?: string } | null) ?? {};
    return {
      id: row.id,
      dossierId,
      senderId: sender.id ?? null,
      senderName: sender.name ?? 'Utilisateur',
      senderRole: sender.role ?? null,
      content: row.body,
      createdAt: row.receivedAt.toISOString(),
    };
  });

  return NextResponse.json({ dossierId, messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId } = await params;
  const user = session.user as any;
  const tenantId = user.tenantId as string | undefined;
  if (!tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId,
    role: user.role,
    groups: user.groups,
    dossierId,
    action: 'write',
  });
  if (!access.allowed) {
    return NextResponse.json({ error: 'Acces refuse au dossier' }, { status: 403 });
  }

  const { content } = await req.json();
  const trimmed = typeof content === 'string' ? content.trim() : '';

  if (!trimmed) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 });
  }
  if (trimmed.length > 5000) {
    return NextResponse.json({ error: 'Message trop long (5000 caracteres max)' }, { status: 400 });
  }

  const id = randomUUID();
  const checksum = createHash('sha256').update(`${tenantId}:${dossierId}:${id}`).digest('hex');

  const row = await prisma.channelMessage.create({
    data: {
      id,
      tenantId,
      dossierId,
      checksum,
      channel: 'INTERNAL',
      direction: 'OUTBOUND',
      status: 'PROCESSED',
      body: trimmed,
      senderData: { id: user.id, name: user.name, role: user.role },
      processedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    message: {
      id: row.id,
      dossierId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: row.body,
      createdAt: row.receivedAt.toISOString(),
    },
  });
}

