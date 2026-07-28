/**
 * PUT /api/legal-deadlines/[id]/acknowledge
 * Acquitte une deadline — stoppe les relances automatiques.
 * PLAN_COMPLET.md §5.4 : "Pas de relance si acknowledgedAt est non null"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const user = session.user as { tenantId?: string; id?: string; role?: string };
  const tenantId = user.tenantId;
  const userId = user.id;
  const role = user.role?.toUpperCase() ?? '';
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });
  if (!userId || !['ADMIN', 'SUPER_ADMIN', 'LAWYER', 'MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { id } = await params;

  const deadline = await prisma.legalDeadline.findFirst({
    where: { id, tenantId },
  });
  if (!deadline) return NextResponse.json({ error: 'Deadline non trouvée' }, { status: 404 });
  if (deadline.acknowledgedAt) {
    return NextResponse.json({ error: 'Déjà acquittée', acknowledgedAt: deadline.acknowledgedAt }, { status: 409 });
  }

  const updated = await prisma.legalDeadline.update({
    where: { id },
    data: { acknowledgedBy: userId, acknowledgedAt: new Date() },
  });

  return NextResponse.json({ success: true, deadline: updated });
}
