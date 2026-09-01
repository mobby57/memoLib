import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/client/dossiers/[id]/checklist
 * Vue client : progression de son dossier (pieces fournies/manquantes)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, clientId: user.clientId || undefined },
    select: {
      id: true,
      numero: true,
      typeDossier: true,
      inboxEmail: true,
      checklistComplete: true,
      checklistTotal: true,
      checklistReceived: true,
      checklistItems: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          label: true,
          category: true,
          required: true,
          status: true,
          receivedAt: true,
          order: true,
        },
      },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const missing = dossier.checklistItems.filter(i => i.status === 'missing' && i.required);
  const received = dossier.checklistItems.filter(i => i.status === 'received' || i.status === 'validated');

  return NextResponse.json({
    numero: dossier.numero,
    type: dossier.typeDossier,
    inboxEmail: dossier.inboxEmail,
    complete: dossier.checklistComplete,
    progress: {
      percentage: dossier.checklistTotal > 0
        ? Math.round((dossier.checklistReceived / dossier.checklistTotal) * 100)
        : 0,
      received: dossier.checklistReceived,
      total: dossier.checklistTotal,
    },
    items: dossier.checklistItems,
    missing: missing.map(i => i.label),
    message: dossier.checklistComplete
      ? 'Votre dossier est complet. Votre avocat va le traiter.'
      : `Il manque ${missing.length} piece(s) obligatoire(s). Envoyez-les a ${dossier.inboxEmail}`,
  });
}
