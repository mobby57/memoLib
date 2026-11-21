import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { logger } from '@/lib/logger';
import {
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notifications';
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10_000).default(0),
});

const updateSchema = z
  .object({
    notificationId: z.string().min(1).optional(),
    markAll: z.boolean().optional(),
  })
  .refine((value) => value.markAll === true || Boolean(value.notificationId));

async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await getServerSessionCompat();
  return session?.user.id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.safeParse({
      unreadOnly: searchParams.get('unreadOnly') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    if (!query.success) {
      return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(query.data.unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: query.data.limit,
        skip: query.data.offset,
      }),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === query.data.limit,
    });
  } catch (error) {
    logger.error('Erreur GET notifications', error instanceof Error ? error : undefined, {
      route: '/api/notifications',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    if (parsed.data.markAll) {
      await markAllNotificationsAsRead(userId);
      return NextResponse.json({
        success: true,
        message: 'Toutes les notifications marquees comme lues',
      });
    }

    const notificationId = parsed.data.notificationId;
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId requis' }, { status: 400 });
    }

    await markNotificationAsRead(notificationId, userId);
    return NextResponse.json({ success: true, message: 'Notification marquee comme lue' });
  } catch (error) {
    logger.error('Erreur PATCH notifications', error instanceof Error ? error : undefined, {
      route: '/api/notifications',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const query = z
      .object({ id: z.string().min(1) })
      .safeParse({ id: new URL(request.url).searchParams.get('id') });

    if (!query.success) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const result = await prisma.notification.deleteMany({
      where: { id: query.data.id, userId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur DELETE notification', error instanceof Error ? error : undefined, {
      route: '/api/notifications',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
