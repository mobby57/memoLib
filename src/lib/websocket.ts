/**
 * WebSocket Server for Real-Time Notifications
 * - Email arrivals
 * - Dossier updates
 * - Deadline alerts
 * - System notifications
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { getAuth } from '@clerk/nextjs/server';
import { logger } from '@/lib/logger';

// Types for WebSocket events
export interface SocketEvents {
  'join-tenant': (tenantId: string) => void;
  'leave-tenant': (tenantId: string) => void;
  'join-user': (userId: string) => void;
  'mark-notification-read': (notificationId: string) => void;
  'email-received': (data: EmailNotification) => void;
  'dossier-updated': (data: DossierNotification) => void;
  'deadline-alert': (data: DeadlineAlert) => void;
  'system-notification': (data: SystemNotification) => void;
  'notification-count': (count: number) => void;
}

export interface EmailNotification {
  id: string;
  type: 'email';
  from: string;
  subject: string;
  priority: 'normal' | 'high' | 'urgent' | 'critical';
  classification?: string;
  timestamp: Date;
  dossierNumber?: string;
}

export interface DossierNotification {
  id: string;
  type: 'dossier';
  action: 'created' | 'updated' | 'status_changed' | 'document_added';
  dossierNumber: string;
  dossierTitle: string;
  status?: string;
  timestamp: Date;
  userId?: string;
}

export interface DeadlineAlert {
  id: string;
  type: 'deadline';
  urgency: 'critical' | 'urgent' | 'warning' | 'info';
  dossierNumber: string;
  deadlineType: string;
  deadlineDate: Date;
  remainingDays: number;
  message: string;
}

export interface SystemNotification {
  id: string;
  type: 'system';
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
}

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    logger.debug('[WebSocket] Already initialized');
    return io;
  }

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware avec Clerk
  io.use(async (socket, next) => {
    try {
      const req = socket.request as any;
      // Utilisation de Clerk pour vérifier la session
      const { userId, sessionId } = getAuth(req);

      if (!userId) {
        return next(new Error('Unauthorized'));
      }

      // Attach user info to socket
      socket.data.userId = userId;
      socket.data.sessionId = sessionId;

      logger.debug(`[WebSocket] User ${userId} authenticated`);
      next();
    } catch (error) {
      logger.error('[WebSocket] Auth error', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', socket => {
    const { userId, tenantId, role } = socket.data;

    logger.debug(`[WebSocket] Client connected: ${socket.id} (User: ${userId}, Tenant: ${tenantId})`);

    // Auto-join user's tenant room
    if (tenantId) {
      socket.join(`tenant:${tenantId}`);
      logger.debug(`[WebSocket] User ${userId} joined tenant room: ${tenantId}`);
    }

    // Auto-join user's personal room
    socket.join(`user:${userId}`);

    // Join tenant room (explicit)
    socket.on('join-tenant', (joinTenantId: string) => {
      if (tenantId !== joinTenantId) {
        logger.warn(`[WebSocket] User ${userId} attempted to join different tenant ${joinTenantId}`);
        return;
      }
      socket.join(`tenant:${joinTenantId}`);
      logger.debug(`[WebSocket] User ${userId} joined tenant ${joinTenantId}`);
    });

    // Leave tenant room
    socket.on('leave-tenant', (leaveTenantId: string) => {
      socket.leave(`tenant:${leaveTenantId}`);
      logger.debug(`[WebSocket] User ${userId} left tenant ${leaveTenantId}`);
    });

    // Join user room
    socket.on('join-user', (joinUserId: string) => {
      if (userId !== joinUserId) {
        logger.warn(`[WebSocket] User ${userId} attempted to join different user room ${joinUserId}`);
        return;
      }
      socket.join(`user:${joinUserId}`);
    });

    // Mark notification as read
    socket.on('mark-notification-read', async (notificationId: string) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        await prisma.notification.update({
          where: { id: notificationId },
          data: { read: true, readAt: new Date() },
        });

        logger.debug(`[WebSocket] Notification ${notificationId} marked as read by ${userId}`);

        const count = await prisma.notification.count({
          where: { userId, read: false },
        });
        socket.emit('notification-count', count);

        await prisma.$disconnect();
      } catch (error) {
        logger.error('[WebSocket] Error marking notification read', error);
      }
    });

    socket.on('disconnect', reason => {
      logger.debug(`[WebSocket] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on('error', error => {
      logger.error('[WebSocket] Socket error', error);
    });
  });

  logger.info('[WebSocket] Server initialized successfully');
  return io;
}

/**
 * Get Socket.IO instance (must be initialized first)
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket() first.');
  }
  return io;
}

/**
 * Emit notification to specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Cannot emit, server not initialized');
    return;
  }
  io.to(`user:${userId}`).emit(event, data);
  logger.debug(`[WebSocket] Emitted ${event} to user ${userId}`);
}

/**
 * Emit notification to entire tenant
 */
export function emitToTenant(tenantId: string, event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Cannot emit, server not initialized');
    return;
  }
  io.to(`tenant:${tenantId}`).emit(event, data);
  logger.debug(`[WebSocket] Emitted ${event} to tenant ${tenantId}`);
}

/**
 * Emit notification to all connected clients
 */
export function emitToAll(event: string, data: any) {
  if (!io) {
    logger.warn('[WebSocket] Cannot emit, server not initialized');
    return;
  }
  io.emit(event, data);
  logger.debug(`[WebSocket] Emitted ${event} to all clients`);
}

/**
 * Helper: Notify when new email arrives
 */
export function notifyEmailReceived(tenantId: string, email: EmailNotification) {
  emitToTenant(tenantId, 'email-received', email);
}

/**
 * Helper: Notify when dossier is updated
 */
export function notifyDossierUpdated(tenantId: string, dossier: DossierNotification) {
  emitToTenant(tenantId, 'dossier-updated', dossier);
}

/**
 * Helper: Notify deadline alert
 */
export function notifyDeadlineAlert(userId: string, alert: DeadlineAlert) {
  emitToUser(userId, 'deadline-alert', alert);
}

/**
 * Helper: Send system notification
 */
export function notifySystem(tenantId: string, notification: SystemNotification) {
  emitToTenant(tenantId, 'system-notification', notification);
}

/**
 * Get count of connected clients
 */
export function getConnectedClientsCount(): number {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

/**
 * Get connected clients for a tenant
 */
export function getTenantClientsCount(tenantId: string): number {
  if (!io) return 0;
  const room = io.sockets.adapter.rooms.get(`tenant:${tenantId}`);
  return room ? room.size : 0;
}

export default {
  initializeWebSocket,
  getIO,
  emitToUser,
  emitToTenant,
  emitToAll,
  notifyEmailReceived,
  notifyDossierUpdated,
  notifyDeadlineAlert,
  notifySystem,
  getConnectedClientsCount,
  getTenantClientsCount,
};
