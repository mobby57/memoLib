import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
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

  // Simuler des messages (en attendant le modele ChatMessage en DB)
  return NextResponse.json({
    dossierId,
    messages: [],
    note: 'Chat en cours de deploiement. Les messages seront stockes en base.',
  });
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

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Message vide' }, { status: 400 });
  }

  // Pour l'instant, retourner le message comme envoye
  const message = {
    id: `msg-${Date.now()}`,
    dossierId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  };

  return NextResponse.json({ success: true, message });
}

