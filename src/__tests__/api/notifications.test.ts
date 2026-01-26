/**
 * Tests pour l'API notifications
 * Tests des endpoints GET, PATCH, DELETE
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock notifications lib
jest.mock('@/lib/notifications', () => ({
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
}));

import { GET, PATCH, DELETE } from '@/app/api/notifications/route';
import prisma from '@/lib/prisma';
import { markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '@/lib/notifications';

describe('API /api/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET /api/notifications
  // ============================================
  describe('GET /api/notifications', () => {
    test('retourne 400 si userId manquant', async () => {
      const request = new Request('http://localhost/api/notifications');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId requis');
    });

    test('retourne les notifications pour un utilisateur', async () => {
      const mockNotifications = [
        { id: '1', title: 'Test 1', isRead: false, createdAt: new Date() },
        { id: '2', title: 'Test 2', isRead: true, createdAt: new Date() },
      ];

      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (getUnreadCount as jest.Mock).mockResolvedValue(1);

      const request = new Request('http://localhost/api/notifications?userId=user123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notifications).toHaveLength(2);
      expect(data.unreadCount).toBe(1);
    });

    test('filtre les notifications non lues', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
      (getUnreadCount as jest.Mock).mockResolvedValue(0);

      const request = new Request('http://localhost/api/notifications?userId=user123&unreadOnly=true');
      const response = await GET(request as any);

      expect(response.status).toBe(200);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
            isRead: false,
          }),
        })
      );
    });

    test('respecte limit et offset', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([]);
      (getUnreadCount as jest.Mock).mockResolvedValue(0);

      const request = new Request('http://localhost/api/notifications?userId=user123&limit=10&offset=20');
      await GET(request as any);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
    });

    test('indique hasMore quand limite atteinte', async () => {
      const mockNotifications = Array(50).fill({ id: '1', title: 'Test' });
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);
      (getUnreadCount as jest.Mock).mockResolvedValue(100);

      const request = new Request('http://localhost/api/notifications?userId=user123&limit=50');
      const response = await GET(request as any);
      const data = await response.json();

      expect(data.hasMore).toBe(true);
    });

    test('gère les erreurs serveur', async () => {
      (prisma.notification.findMany as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/notifications?userId=user123');
      const response = await GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur serveur');
    });
  });

  // ============================================
  // PATCH /api/notifications
  // ============================================
  describe('PATCH /api/notifications', () => {
    test('retourne 400 si userId manquant', async () => {
      const request = new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userId requis');
    });

    test('marque toutes les notifications comme lues', async () => {
      (markAllNotificationsAsRead as jest.Mock).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'user123', markAll: true }),
      });
      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(markAllNotificationsAsRead).toHaveBeenCalledWith('user123');
    });

    test('marque une notification spécifique comme lue', async () => {
      (markNotificationAsRead as jest.Mock).mockResolvedValue(undefined);

      const request = new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'user123', notificationId: 'notif456' }),
      });
      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(markNotificationAsRead).toHaveBeenCalledWith('notif456', 'user123');
    });

    test('retourne 400 si ni notificationId ni markAll fourni', async () => {
      const request = new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'user123' }),
      });
      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('notificationId ou markAll requis');
    });

    test('gère les erreurs serveur', async () => {
      (markNotificationAsRead as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ userId: 'user123', notificationId: 'notif456' }),
      });
      const response = await PATCH(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Erreur serveur');
    });
  });

  // ============================================
  // DELETE /api/notifications
  // ============================================
  describe('DELETE /api/notifications', () => {
    test('retourne 400 si id manquant', async () => {
      const request = new Request('http://localhost/api/notifications?userId=user123', {
        method: 'DELETE',
      });
      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    test('retourne 400 si userId manquant', async () => {
      const request = new Request('http://localhost/api/notifications?id=notif123', {
        method: 'DELETE',
      });
      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    test('supprime une notification avec succès', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({ id: 'notif123', userId: 'user123' });
      (prisma.notification.delete as jest.Mock).mockResolvedValue({ id: 'notif123' });

      const request = new Request('http://localhost/api/notifications?id=notif123&userId=user123', {
        method: 'DELETE',
      });
      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('gère les erreurs serveur lors de la suppression', async () => {
      (prisma.notification.findFirst as jest.Mock).mockRejectedValue(new Error('DB Error'));

      const request = new Request('http://localhost/api/notifications?id=notif123&userId=user123', {
        method: 'DELETE',
      });
      const response = await DELETE(request as any);
      const data = await response.json();

      expect(response.status).toBe(500);
    });
  });
});
