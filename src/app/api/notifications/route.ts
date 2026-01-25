import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  getUnreadCount 
} from '@/lib/notifications';

// GET - Recuperer les notifications d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly ? { isRead: false } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      getUnreadCount(userId),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      hasMore: notifications.length === limit,
    });
  } catch (error) {
    console.error('Erreur GET notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Marquer notification(s) comme lue(s)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, notificationId, markAll } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    if (markAll) {
      await markAllNotificationsAsRead(userId);
      return NextResponse.json({ success: true, message: 'Toutes les notifications marquees comme lues' });
    }

    if (notificationId) {
      await markNotificationAsRead(notificationId, userId);
      return NextResponse.json({ success: true, message: 'Notification marquee comme lue' });
    }

    return NextResponse.json({ error: 'notificationId ou markAll requis' }, { status: 400 });
  } catch (error) {
    console.error('Erreur PATCH notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!notificationId || !userId) {
      return NextResponse.json({ error: 'id et userId requis' }, { status: 400 });
    }

    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE notification:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
