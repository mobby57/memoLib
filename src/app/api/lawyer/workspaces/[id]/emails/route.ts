import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';

const emailActionSchema = z.object({
  emailId: z.string().min(1).max(255),
  action: z.enum(['mark_read', 'mark_unread', 'star', 'unstar', 'archive', 'unarchive']),
}).strict();

const emailFilterSchema = z.object({
  category: z.string().max(80).optional(),
  priority: z.string().max(32).optional(),
  isRead: z.enum(['true', 'false']).optional(),
  needsResponse: z.enum(['true', 'false']).optional(),
  search: z.string().max(200).optional(),
}).strict();

function getUpdateData(action: z.infer<typeof emailActionSchema>['action']) {
  switch (action) {
    case 'mark_read':
      return { isRead: true, readAt: new Date() };
    case 'mark_unread':
      return { isRead: false, readAt: null };
    case 'star':
      return { isStarred: true };
    case 'unstar':
      return { isStarred: false };
    case 'archive':
      return { isArchived: true };
    case 'unarchive':
      return { isArchived: false };
  }
}

async function updateEmailAction(
  request: NextRequest,
  params: { id: string }
) {
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Cabinet requis' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = emailActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
  }

  const prisma = await getSecurePrisma();
  const where = {
    id: parsed.data.emailId,
    tenantId,
    workspaceId: params.id,
  };
  const updated = await prisma.email.updateMany({
    where,
    data: getUpdateData(parsed.data.action),
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: 'Email non trouve' }, { status: 404 });
  }

  const email = await prisma.email.findFirst({ where });
  if (!email) {
    return NextResponse.json({ error: 'Email non trouve' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: `Action ${parsed.data.action} effectuee`,
    email: { ...email, priority: email.urgency },
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await updateEmailAction(request, params);
  } catch (error) {
    logger.error('Erreur action email', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/emails',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Cabinet requis' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = emailFilterSchema.safeParse({
      category: searchParams.get('category') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      isRead: searchParams.get('isRead') ?? undefined,
      needsResponse: searchParams.get('needsResponse') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    });
    if (!filters.success) {
      return NextResponse.json({ error: 'Filtres invalides' }, { status: 400 });
    }

    const { category, priority, isRead, needsResponse, search } = filters.data;
    const where = {
      tenantId,
      workspaceId: params.id,
      ...(category ? { category } : {}),
      ...(priority ? { urgency: priority } : {}),
      ...(isRead ? { isRead: isRead === 'true' } : {}),
      ...(needsResponse ? { needsResponse: needsResponse === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { from: { contains: search, mode: 'insensitive' as const } },
              { subject: { contains: search, mode: 'insensitive' as const } },
              { bodyText: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const prisma = await getSecurePrisma();
    const records = await prisma.email.findMany({
      where,
      orderBy: { receivedDate: 'desc' },
      take: 100,
    });
    const emails = records.map(email => ({ ...email, priority: email.urgency }));

    return NextResponse.json({ success: true, emails, count: emails.length });
  } catch (error) {
    logger.error('Erreur recuperation emails workspace', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/emails',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
