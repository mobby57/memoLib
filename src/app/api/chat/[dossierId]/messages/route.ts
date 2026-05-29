import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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
