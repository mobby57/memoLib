import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/clerk-auth';
import { GDPRCompliance } from '@/lib/compliance/gdpr';
import { logger } from '@/lib/logger';

const deletionRequestSchema = z.object({ confirm: z.literal(true) }).strict();

export async function POST(request: NextRequest) {
  const { user } = await auth();
  if (!user?.tenantId) {
    return NextResponse.json({ error: user ? 'Accès refusé' : 'Non authentifié' }, { status: user ? 403 : 401 });
  }

  const parsed = deletionRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmation explicite requise' }, { status: 400 });
  }

  try {
    const deletion = await GDPRCompliance.requestDeletion(user.id);
    return NextResponse.json({
      requestId: deletion.id,
      status: deletion.status,
      scheduledFor: deletion.scheduledFor,
      manualReviewRequired: true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'An erasure request is already pending.') {
      return NextResponse.json({ error: 'Une demande est déjà en cours.' }, { status: 409 });
    }
    logger.error('Erasure request failed', error, { userId: user.id, tenantId: user.tenantId });
    return NextResponse.json({ error: 'Impossible de créer la demande' }, { status: 500 });
  }
}

export async function DELETE() {
  const { user } = await auth();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const cancelled = await GDPRCompliance.cancelDeletion(user.id);
    if (!cancelled) {
      return NextResponse.json({ error: 'Aucune demande active' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erasure cancellation failed', error, { userId: user.id });
    return NextResponse.json({ error: 'Impossible d’annuler la demande' }, { status: 500 });
  }
}
