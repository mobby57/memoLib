import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createEventLog } from '@/lib/services/event-log.service';

/**
 * POST /api/emails/[id]/integrate
 * 
 * Intégration manuelle d'un email brut dans le système.
 * L'avocat décide explicitement d'intégrer une info reçue.
 * 
 * Body optionnel : { dossierId?, clientId?, action: "integrate" | "archive" | "ignore" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const tenantId = (session.user as any).tenantId;
  const userId = (session.user as any).id;

  const email = await prisma.email.findFirst({
    where: { id, tenantId },
  });

  if (!email) {
    return NextResponse.json({ error: 'Email non trouvé' }, { status: 404 });
  }

  if (email.processingStatus !== 'RECEIVED') {
    return NextResponse.json({ error: `Email déjà traité (état: ${email.processingStatus})` }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'integrate';

  if (action === 'archive' || action === 'ignore') {
    await prisma.email.update({
      where: { id },
      data: {
        processingStatus: action === 'archive' ? 'ARCHIVED' : 'IGNORED',
        isArchived: action === 'archive',
        processedAt: new Date(),
      },
    });

    await createEventLog({
      eventType: 'FLOW_PROCESSED',
      entityType: 'email',
      entityId: id,
      actorType: 'USER',
      actorId: userId,
      tenantId,
      metadata: { action, reason: body.reason },
    });

    return NextResponse.json({ success: true, status: action === 'archive' ? 'ARCHIVED' : 'IGNORED' });
  }

  // Action = integrate
  const updateData: any = {
    processingStatus: 'INTEGRATED',
    isProcessed: true,
    processedAt: new Date(),
  };

  if (body.dossierId) updateData.dossierId = body.dossierId;
  if (body.clientId) updateData.clientId = body.clientId;

  await prisma.email.update({ where: { id }, data: updateData });

  await createEventLog({
    eventType: 'FLOW_PROCESSED',
    entityType: 'email',
    entityId: id,
    actorType: 'USER',
    actorId: userId,
    tenantId,
    metadata: {
      action: 'integrate',
      dossierId: body.dossierId || null,
      clientId: body.clientId || null,
    },
  });

  return NextResponse.json({
    success: true,
    status: 'INTEGRATED',
    dossierId: body.dossierId || null,
  });
}
