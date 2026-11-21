import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/getServerSessionCompat', () => ({
  getServerSessionCompat: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/notifications', () => ({
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
  getUnreadCount: vi.fn(),
}));

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { GET, PATCH, DELETE } from '@/app/api/notifications/route';
import {
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notifications';
import prisma from '@/lib/prisma';

const authenticatedSession = {
  user: {
    id: 'internal-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'CLIENT',
    tenantId: 'tenant-id',
    tenantName: 'Test Tenant',
    clientId: null,
  },
};

describe('API /api/notifications authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSessionCompat).mockResolvedValue(authenticatedSession);
    vi.mocked(getUnreadCount).mockResolvedValue(0);
  });

  it('rejects unauthenticated requests', async () => {
    vi.mocked(getServerSessionCompat).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/notifications') as never);

    expect(response.status).toBe(401);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('scopes GET to the authenticated user, ignoring a supplied userId', async () => {
    vi.mocked(prisma.notification.findMany).mockResolvedValue([]);

    const request = new Request(
      'http://localhost/api/notifications?userId=another-user&unreadOnly=true'
    );
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'internal-user-id', isRead: false },
      })
    );
    expect(getUnreadCount).toHaveBeenCalledWith('internal-user-id');
  });

  it('returns notifications, unread count, and pagination metadata', async () => {
    const notifications = [{ id: 'notification-1' }, { id: 'notification-2' }];
    vi.mocked(prisma.notification.findMany).mockResolvedValue(notifications as never);
    vi.mocked(getUnreadCount).mockResolvedValue(3);

    const response = await GET(
      new Request('http://localhost/api/notifications?limit=2&offset=10') as never
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications).toEqual(notifications);
    expect(data.unreadCount).toBe(3);
    expect(data.hasMore).toBe(true);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 2, skip: 10 })
    );
  });

  it('rejects invalid pagination parameters', async () => {
    const response = await GET(
      new Request('http://localhost/api/notifications?limit=999') as never
    );

    expect(response.status).toBe(400);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('returns 500 when notification retrieval fails', async () => {
    vi.mocked(prisma.notification.findMany).mockRejectedValue(new Error('database failure'));

    const response = await GET(
      new Request('http://localhost/api/notifications') as never
    );

    expect(response.status).toBe(500);
  });

  it('rejects unauthenticated PATCH requests', async () => {
    vi.mocked(getServerSessionCompat).mockResolvedValue(null);

    const response = await PATCH(
      new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ markAll: true }),
      }) as never
    );

    expect(response.status).toBe(401);
    expect(markAllNotificationsAsRead).not.toHaveBeenCalled();
  });

  it('scopes mark-all PATCH to the authenticated user', async () => {
    const request = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ userId: 'another-user', markAll: true }),
    });
    const response = await PATCH(request as never);

    expect(response.status).toBe(200);
    expect(markAllNotificationsAsRead).toHaveBeenCalledWith('internal-user-id');
  });

  it('scopes single-notification PATCH to the authenticated user', async () => {
    const request = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: 'another-user',
        notificationId: 'notification-id',
      }),
    });
    const response = await PATCH(request as never);

    expect(response.status).toBe(200);
    expect(markNotificationAsRead).toHaveBeenCalledWith(
      'notification-id',
      'internal-user-id'
    );
  });

  it('rejects an empty PATCH body', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
      }) as never
    );

    expect(response.status).toBe(400);
  });

  it('returns 500 when marking a notification fails', async () => {
    vi.mocked(markNotificationAsRead).mockRejectedValue(new Error('database failure'));

    const response = await PATCH(
      new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId: 'notification-id' }),
      }) as never
    );

    expect(response.status).toBe(500);
  });

  it('rejects unauthenticated DELETE requests', async () => {
    vi.mocked(getServerSessionCompat).mockResolvedValue(null);

    const response = await DELETE(
      new Request('http://localhost/api/notifications?id=notification-id') as never
    );

    expect(response.status).toBe(401);
    expect(prisma.notification.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes only a notification owned by the authenticated user', async () => {
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 1 });

    const response = await DELETE(
      new Request(
        'http://localhost/api/notifications?id=notification-id&userId=another-user'
      ) as never
    );

    expect(response.status).toBe(200);
    expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: 'notification-id', userId: 'internal-user-id' },
    });
  });

  it('returns 404 when the notification is not owned by the authenticated user', async () => {
    vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 0 });

    const response = await DELETE(
      new Request('http://localhost/api/notifications?id=notification-id') as never
    );

    expect(response.status).toBe(404);
  });

  it('rejects DELETE requests without a notification id', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/notifications') as never
    );

    expect(response.status).toBe(400);
  });

  it('returns 500 when notification deletion fails', async () => {
    vi.mocked(prisma.notification.deleteMany).mockRejectedValue(new Error('database failure'));

    const response = await DELETE(
      new Request('http://localhost/api/notifications?id=notification-id') as never
    );

    expect(response.status).toBe(500);
  });
});
