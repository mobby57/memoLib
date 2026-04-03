import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_STATUS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;
const ALLOWED_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

function normalizeStatus(value: unknown): (typeof ALLOWED_STATUS)[number] | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();
  if (normalized === 'IN-PROGRESS' || normalized === 'IN PROGRESS') return 'IN_PROGRESS';

  return ALLOWED_STATUS.includes(normalized as (typeof ALLOWED_STATUS)[number])
    ? (normalized as (typeof ALLOWED_STATUS)[number])
    : null;
}

function normalizePriority(value: unknown): (typeof ALLOWED_PRIORITY)[number] | null {
  if (typeof value !== 'string') return null;

  const normalized = value.trim().toUpperCase();

  return ALLOWED_PRIORITY.includes(normalized as (typeof ALLOWED_PRIORITY)[number])
    ? (normalized as (typeof ALLOWED_PRIORITY)[number])
    : null;
}

/**
 * PATCH /api/v1/tasks/[id]
 * Update task status and/or priority
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = requireApiPermission(session, RBAC_PERMISSIONS.TASKS_MANAGE);
    if (!guard.ok) {
      return guard.response;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const existing = await prisma.task.findFirst({
      where: {
        id: params.id,
        createdBy: {
          tenantId: user.tenantId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const status = body.status !== undefined ? normalizeStatus(body.status) : undefined;
    const priority = body.priority !== undefined ? normalizePriority(body.priority) : undefined;
    const assignedToId = body.assignedToId !== undefined ? String(body.assignedToId) : undefined;

    if (body.status !== undefined && status === null) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    if (body.priority !== undefined && priority === null) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    if (assignedToId !== undefined) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          tenantId: user.tenantId,
        },
      });

      if (!assignee) {
        return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 });
      }
    }

    if (status === undefined && priority === undefined && assignedToId === undefined) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(assignedToId !== undefined ? { assignedToId } : {}),
      },
      include: { case: true, assignedTo: true, createdBy: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/v1/tasks/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
