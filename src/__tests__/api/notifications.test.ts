import { beforeEach, describe, expect, it, vi } from 'vitest';

const { session, prisma } = vi.hoisted(() => ({
  session: { current: null as { user?: { id?: string } } | null },
  prisma: {
    notification: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn(() => session.current),
}));
vi.mock('@/app/api/auth/[...nextauth]/route', () => ({ authOptions: {} }));
vi.mock('@/lib/prisma', () => ({ __esModule: true, default: prisma }));
vi.mock('@/lib/notifications', () => ({
  getUnreadCount: vi.fn(() => 0),
  markAllNotificationsAsRead: vi.fn(),
  markNotificationAsRead: vi.fn(),
}));

import { DELETE, GET, PATCH } from '@/app/api/notifications/route';
import { getUnreadCount, markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/notifications';

describe('API /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    session.current = { user: { id: 'user-a' } };
  });

  it('rejects anonymous reads', async () => {
    session.current = null;
    expect((await GET(new Request('http://localhost/api/notifications') as never)).status).toBe(401);
  });

  it('ignores a supplied userId and scopes reads to the session user', async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    await GET(new Request('http://localhost/api/notifications?userId=user-b') as never);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-a' }) })
    );
  });

  it('ignores a supplied userId when marking all notifications read', async () => {
    await PATCH(new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-b', markAll: true }),
    }) as never);
    expect(markAllNotificationsAsRead).toHaveBeenCalledWith('user-a');
  });

  it('scopes a notification update to the session user', async () => {
    await PATCH(new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'user-b', notificationId: 'notification-1' }),
    }) as never);
    expect(markNotificationAsRead).toHaveBeenCalledWith('notification-1', 'user-a');
  });

  it('does not delete a notification not owned by the session user', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    const response = await DELETE(
      new Request('http://localhost/api/notifications?id=notification-b&userId=user-b', {
        method: 'DELETE',
      }) as never
    );
    expect(response.status).toBe(404);
    expect(prisma.notification.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'notification-b', userId: 'user-a' } })
    );
  });

  it('rejects anonymous mutations', async () => {
    session.current = null;
    const response = await PATCH(new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ markAll: true }),
    }) as never);
    expect(response.status).toBe(401);
  });
});
