'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

/**
 * 🔔 Page de Notifications Contextuelles Interactives
 */

interface Notification {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  requiresAction: boolean;
  dismissible: boolean;
  actions: Action[];
  createdAt: string;
  expiresAt?: string;
}

interface Action {
  id: string;
  label: string;
  type: 'open-form' | 'schedule' | 'reply' | 'delegate' | 'archive';
  primary: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Polling pour nouvelles notifications
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/active');
      const data = await response.json();
      setNotifications(data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setLoading(false);
    }
  };

  const handleAction = async (notifId: string, action: Action) => {
    console.log('Action:', action.type, 'pour notification:', notifId);
    
    if (action.type === 'open-form') {
      // Rediriger vers le formulaire dynamique
      window.location.href = `/lawyer/workflows/form/${notifId}`;
    } else if (action.type === 'schedule') {
      window.location.href = `/lawyer/workflows/calendar/${notifId}`;
    } else if (action.type === 'reply') {
      window.location.href = `/lawyer/workflows/email/${notifId}`;
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'border-red-500 bg-red-50';
    if (severity === 'warning') return 'border-orange-500 bg-orange-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'warning') return '⚠️';
    return 'ℹ️';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const criticalNotifications = notifications.filter(n => n.severity === 'critical');
  const otherNotifications = notifications.filter(n => n.severity !== 'critical');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">🔔 Notifications Interactives</h1>
        <p className="text-gray-600">
          Actions requises pour vos emails et workflows
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Notifications Actives</CardDescription>
            <CardTitle className="text-3xl">{notifications.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actions Critiques</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {criticalNotifications.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nécessitent Action</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {notifications.filter(n => n.requiresAction).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Notifications Critiques */}
      {criticalNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-red-600">🚨 Actions Critiques</h2>
          {criticalNotifications.map((notif) => (
            <Alert
              key={notif.id}
              className={`border-2 ${getSeverityColor(notif.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2 text-lg font-bold">
                    <span className="text-2xl">{getSeverityIcon(notif.severity)}</span>
                    {notif.title}
                  </AlertTitle>
                  <AlertDescription className="mt-2">
                    {notif.message}
                  </AlertDescription>
                  {notif.expiresAt && (
                    <p className="text-sm text-red-600 mt-2">
                      ⏰ Expire: {new Date(notif.expiresAt).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {notif.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.primary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAction(notif.id, action)}
                      className={action.primary ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Autres Notifications */}
      {otherNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">📋 Autres Notifications</h2>
          {otherNotifications.map((notif) => (
            <Card key={notif.id} className={`border-l-4 ${getSeverityColor(notif.severity)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <span>{getSeverityIcon(notif.severity)}</span>
                      {notif.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {notif.message}
                    </CardDescription>
                  </div>
                  <Badge variant={notif.requiresAction ? 'default' : 'secondary'}>
                    {notif.requiresAction ? 'Action Requise' : 'Information'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {notif.actions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.primary ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAction(notif.id, action)}
                    >
                      {action.label}
                    </Button>
                  ))}
                  {notif.dismissible && (
                    <Button variant="ghost" size="sm">
                      Ignorer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-gray-600">Aucune notification en attente</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
