import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await prisma.task.findMany({
      where: {
        ...where,
        assignedToId: user.id,
      },
      include: { case: true, createdBy: true },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json({ data: tasks });
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
