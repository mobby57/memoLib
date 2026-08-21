/**
 * PUT /api/legal-deadlines/[id]/suspend
 * Suspend une deadline (bloquée par un tiers).
 * PLAN_COMPLET.md §4 CU-05 : justification obligatoire, rappel J+14.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { z } from 'zod';

const SuspendSchema = z.object({
  reason: z.string().min(5, 'Justification requise (min 5 caractères)'),
});

export async function PUT(
  request: NextRequest,
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

  const body = await request.json().catch(() => ({}));
  const parsed = SuspendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { id } = await params;

  const deadline = await prisma.legalDeadline.findFirst({ where: { id, tenantId } });
  if (!deadline) return NextResponse.json({ error: 'Deadline non trouvée' }, { status: 404 });
  if (deadline.status === 'SUSPENDED') {
    return NextResponse.json({ error: 'Déjà suspendue' }, { status: 409 });
  }

  const now = new Date();
  const reminderDate = new Date(now.getTime() + 14 * 86_400_000);

  const updated = await prisma.legalDeadline.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      suspendedReason: parsed.data.reason,
      suspendedAt: now,
      suspendedBy: userId,
    },
  });

  return NextResponse.json({ success: true, deadline: updated, reminderDate });
}

/**
 * DELETE /api/legal-deadlines/[id]/suspend — Réactive une deadline suspendue
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const user = session.user as { tenantId?: string; role?: string };
  const tenantId = user.tenantId;
  const role = user.role?.toUpperCase() ?? '';
  if (!tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 403 });
  if (!['ADMIN', 'SUPER_ADMIN', 'LAWYER', 'MANAGER'].includes(role)) {
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }

  const { id } = await params;

  const deadline = await prisma.legalDeadline.findFirst({ where: { id, tenantId, status: 'SUSPENDED' } });
  if (!deadline) return NextResponse.json({ error: 'Deadline suspendue non trouvée' }, { status: 404 });

  const now = new Date();
  // Recalculer le statut selon la date d'échéance
  let newStatus: string = 'PENDING';
  const daysLeft = (deadline.dueDate.getTime() - now.getTime()) / 86_400_000;
  if (daysLeft < 0) newStatus = 'OVERDUE';
  else if (daysLeft <= 1) newStatus = 'CRITICAL';
  else if (daysLeft <= 3) newStatus = 'URGENT';
  else if (daysLeft <= 7) newStatus = 'APPROACHING';

  const updated = await prisma.legalDeadline.update({
    where: { id },
    data: {
      status: newStatus as 'PENDING' | 'APPROACHING' | 'URGENT' | 'CRITICAL' | 'OVERDUE',
      suspendedReason: null,
      suspendedAt: null,
      suspendedBy: null,
    },
  });

  return NextResponse.json({ success: true, deadline: updated });
}
