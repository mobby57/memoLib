'use client';

/**
 * WebSocket Notification Demo Component
 * 
 * Demonstrates real-time notifications using Socket.io:
 * - Email arrivals
 * - Dossier updates
 * - Deadline alerts
 * - System notifications
 */

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  EmailNotification,
  DossierNotification,
  DeadlineAlert,
  SystemNotification,
} from '@/lib/websocket';

interface Notification {
  id: string;
  type: 'email' | 'dossier' | 'deadline' | 'system';
  message: string;
  timestamp: Date;
  priority?: string;
}

export function WebSocketNotificationDemo({ tenantId }: { tenantId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize Socket.io client
    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);

      // Join tenant room
      socketInstance.emit('join-tenant', tenantId);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    // Email notifications
    socketInstance.on('email-received', (data: EmailNotification) => {
      setNotifications(prev => [
        {
          id: data.id,
          type: 'email',
          message: `📧 Nouveau email: ${data.subject} (${data.priority})`,
          timestamp: new Date(data.timestamp),
          priority: data.priority,
        },
        ...prev,
      ]);
    });

    // Dossier updates
    socketInstance.on('dossier-updated', (data: DossierNotification) => {
      setNotifications(prev => [
        {
          id: data.id,
          type: 'dossier',
          message: `📁 Dossier ${data.dossierNumber}: ${data.action}`,
          timestamp: new Date(data.timestamp),
        },
        ...prev,
      ]);
    });

    // Deadline alerts
    socketInstance.on('deadline-alert', (data: DeadlineAlert) => {
      setNotifications(prev => [
        {
          id: data.id,
          type: 'deadline',
          message: `⏰ ${data.message} (${data.remainingDays}j restants)`,
          timestamp: new Date(),
          priority: data.urgency,
        },
        ...prev,
      ]);
    });

    // System notifications
    socketInstance.on('system-notification', (data: SystemNotification) => {
      setNotifications(prev => [
        {
          id: data.id,
          type: 'system',
          message: `ℹ️ ${data.title}: ${data.message}`,
          timestamp: new Date(data.timestamp),
          priority: data.level,
        },
        ...prev,
      ]);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [tenantId]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent':
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Notifications en Temps Réel
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>
        <button
          onClick={clearNotifications}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Effacer tout
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune notification pour le moment
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border ${getPriorityColor(
                notif.priority
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{notif.message}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {notif.timestamp.toLocaleString('fr-FR')}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                  {notif.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Total: {notifications.length} notification(s)
        </p>
      </div>
    </div>
  );
}
