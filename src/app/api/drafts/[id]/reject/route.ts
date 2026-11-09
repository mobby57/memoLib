/**
 * PUT /api/drafts/[id]/reject â€” Rejette un draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });

    const tenantId = (session.user as any).tenantId;
    const userId = (session.user as any).id;
    if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const draft = await prisma.draft.findFirst({ where: { id, tenantId, status: 'PENDING' } });
    if (!draft) return NextResponse.json({ error: 'Draft non trouvÃ© ou dÃ©jÃ  traitÃ©' }, { status: 404 });

    await prisma.draft.update({
      where: { id },
      data: { status: 'REJECTED', validatedBy: userId, validatedAt: new Date(), rejectionReason: body.reason || null },
    });

    return NextResponse.json({ success: true, message: 'Draft rejetÃ©' });
  } catch (error) {
    console.error('[DRAFTS] Reject error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

