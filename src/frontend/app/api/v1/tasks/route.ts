import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/server-session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/tasks
 * List tasks for current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = requireApiPermission(session, RBAC_PERMISSIONS.TASKS_READ);
    if (!guard.ok) {
      return guard.response;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const includeAssignees = searchParams.get('includeAssignees') === '1';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = (searchParams.get('sortOrder') || 'asc').toLowerCase();

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const allowedSortBy = ['dueDate', 'createdAt', 'priority', 'status'] as const;
    const normalizedSortBy = allowedSortBy.includes(sortBy as (typeof allowedSortBy)[number])
      ? (sortBy as (typeof allowedSortBy)[number])
      : 'dueDate';
    const normalizedSortOrder: 'asc' | 'desc' = sortOrder === 'desc' ? 'desc' : 'asc';

    const tasks = await prisma.task.findMany({
      where: {
        ...where,
        assignedToId: user.id,
      },
      include: { case: true, createdBy: true, assignedTo: true },
      orderBy: { [normalizedSortBy]: normalizedSortOrder },
    });

    if (!includeAssignees) {
      return NextResponse.json({ data: tasks });
    }

    const assignees = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: { in: ['ADMIN', 'LAWYER'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: tasks, assignees });
  } catch (error) {
    console.error('[GET /api/v1/tasks]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/tasks
 * Create a new task
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { caseId, assignedToId, title, description, dueDate, priority } = body;

    if (!assignedToId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: assignedToId, title' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        caseId: caseId || null,
        createdById: user.id,
        assignedToId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: 'TODO',
      },
      include: { case: true, assignedTo: true, createdBy: true },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/tasks]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
