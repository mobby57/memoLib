import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/events
 * List calendar events
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
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = { userId: user.id };
    if (from && to) {
      where.AND = [
        { startDate: { gte: new Date(from) } },
        { endDate: { lte: new Date(to) } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: { case: true },
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('[GET /api/v1/events]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/events
 * Create a calendar event
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
    const { caseId, title, description, startTime, endTime, location, reminders, visibleToClient } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startTime, endTime' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        caseId: caseId || null,
        createdById: user.id,
        title,
        description: description || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        reminders: reminders || [],
        visibleToClient: visibleToClient || false,
      },
      include: { case: true, createdBy: true },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('[POST /api/v1/events]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
