/**
 * PUT /api/drafts/[id]/reject — Rejette un draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const tenantId = (session.user as any).tenantId;
    const userId = (session.user as any).id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const draft = await prisma.draft.findFirst({ where: { id, tenantId, status: 'PENDING' } });
    if (!draft) return NextResponse.json({ error: 'Draft non trouvé ou déjà traité' }, { status: 404 });

    await prisma.draft.update({
      where: { id },
      data: { status: 'REJECTED', validatedBy: userId, validatedAt: new Date(), rejectionReason: body.reason || null },
    });

    return NextResponse.json({ success: true, message: 'Draft rejeté' });
  } catch (error) {
    console.error('[DRAFTS] Reject error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
