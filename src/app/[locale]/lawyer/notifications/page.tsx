'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import QuestionnaireModal from '@/components/forms/QuestionnaireModal';
import { AlertTriangle, Bell, ShieldAlert } from 'lucide-react';

/**
 *  Page de Notifications Contextuelles Interactives
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

interface PendingActionApiItem {
  id: string;
  eventType: string;
  from: string;
  subject: string;
  preview?: string;
  urgency?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionnaireEventId, setSelectedQuestionnaireEventId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.tenantId) return;
    loadNotifications();

    // Polling pour nouvelles notifications
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.tenantId]);

  const loadNotifications = async () => {
    if (!user?.tenantId) return;

    try {
      const response = await fetch(`/api/pending-actions?tenantId=${user.tenantId}&limit=100`);
      const data = await response.json();

      const mappedNotifications: Notification[] = (data.actions || []).map(
        (action: PendingActionApiItem) => ({
          id: action.id,
          type: action.eventType,
          severity: action.urgency === 'high' || action.urgency === 'critical' ? 'critical' : 'warning',
          title: action.subject,
          message: action.preview || `Message reçu de ${action.from}`,
          requiresAction: true,
          dismissible: true,
          createdAt: action.createdAt,
          actions: [
            { id: 'open-form', label: 'Questionnaire', type: 'open-form', primary: false },
            { id: 'reply', label: 'Approuver', type: 'reply', primary: true },
            { id: 'archive', label: 'Rejeter', type: 'archive', primary: false },
          ],
        })
      );

      setNotifications(mappedNotifications);
      setSelectedIds([]);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      setLoading(false);
    }
  };

  const handleAction = async (notifId: string, action: Action) => {
    if (!user?.tenantId) return;

    if (action.type === 'open-form') {
      setSelectedQuestionnaireEventId(notifId);
    } else if (action.type === 'reply') {
      await fetch(`/api/pending-actions/${notifId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user.tenantId,
          createCase: true,
          createClient: true,
          priority: 3,
        }),
      });
      await loadNotifications();
    } else if (action.type === 'archive') {
      await fetch(`/api/pending-actions/${notifId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: user.tenantId,
          reason: 'notification-reject',
          markAsSpam: false,
          archive: true,
        }),
      });
      await loadNotifications();
    }
  };

  const handleDismiss = async (notifId: string) => {
    if (!user?.tenantId) return;

    await fetch(`/api/pending-actions/${notifId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: user.tenantId,
        reason: 'notification-dismiss',
        markAsSpam: false,
        archive: true,
      }),
    });

    await loadNotifications();
  };

  const toggleSelection = (notifId: string) => {
    setSelectedIds(prev =>
      prev.includes(notifId) ? prev.filter(id => id !== notifId) : [...prev, notifId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(notifications.map(notif => notif.id));
  };

  const bulkApprove = async () => {
    if (!user?.tenantId || selectedIds.length === 0) return;

    const response = await fetch('/api/pending-actions/bulk-approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: user.tenantId,
        actionIds: selectedIds,
      }),
    });

    if (response.ok) {
      await loadNotifications();
    }
  };

  const bulkReject = async () => {
    if (!user?.tenantId || selectedIds.length === 0) return;

    const response = await fetch('/api/pending-actions/bulk-reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: user.tenantId,
        actionIds: selectedIds,
        reason: 'notification-bulk-reject',
        markAsSpam: false,
        archive: true,
      }),
    });

    if (response.ok) {
      await loadNotifications();
    }
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'critical') return 'border-red-500 bg-red-50';
    if (severity === 'warning') return 'border-orange-500 bg-orange-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <ShieldAlert className="w-5 h-5 text-red-600" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    return <Bell className="w-5 h-5 text-blue-600" />;
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
      {/* En-tete */}
      <div>
        <h1 className="text-3xl font-bold"> Notifications Interactives</h1>
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
            <CardDescription>Necessitent Action</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {notifications.filter(n => n.requiresAction).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {notifications.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === notifications.length}
                  onChange={toggleSelectAll}
                />
                Tout sélectionner ({notifications.length})
              </label>

              <span className="text-sm text-gray-500">Sélectionnés: {selectedIds.length}</span>

              <Button size="sm" onClick={bulkApprove} disabled={selectedIds.length === 0}>
                Approuver en lot
              </Button>
              <Button size="sm" variant="outline" onClick={bulkReject} disabled={selectedIds.length === 0}>
                Rejeter en lot
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedIds[0] && setSelectedQuestionnaireEventId(selectedIds[0])}
                disabled={selectedIds.length === 0}
              >
                Questionnaire (1er)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Critiques */}
      {criticalNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-red-600"> Actions Critiques</h2>
          {criticalNotifications.map((notif) => (
            <Alert
              key={notif.id}
              className={`border-2 ${getSeverityColor(notif.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notif.id)}
                      onChange={() => toggleSelection(notif.id)}
                      aria-label={`Sélectionner la notification ${notif.title}`}
                    />
                    {getSeverityIcon(notif.severity)}
                    {notif.title}
                  </h3>
                  <p className="mt-2">
                    {notif.message}
                  </p>
                  {notif.expiresAt && (
                    <p className="text-sm text-red-600 mt-2">
                       Expire: {new Date(notif.expiresAt).toLocaleString('fr-FR')}
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
          <h2 className="text-2xl font-bold"> Autres Notifications</h2>
          {otherNotifications.map((notif) => (
            <Card key={notif.id} className={`border-l-4 ${getSeverityColor(notif.severity)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notif.id)}
                        onChange={() => toggleSelection(notif.id)}
                        aria-label={`Sélectionner la notification ${notif.title}`}
                      />
                      {getSeverityIcon(notif.severity)}
                      {notif.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {notif.message}
                    </CardDescription>
                  </div>
                  <Badge variant={notif.requiresAction ? 'default' : 'info'}>
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
                    <Button variant="ghost" size="sm" onClick={() => handleDismiss(notif.id)}>
                      Ignorer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* etat vide */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-2xl mb-2"></p>
            <p className="text-gray-600">Aucune notification en attente</p>
          </CardContent>
        </Card>
      )}

      {user?.tenantId && (
        <QuestionnaireModal
          isOpen={Boolean(selectedQuestionnaireEventId)}
          onClose={() => setSelectedQuestionnaireEventId(null)}
          tenantId={user.tenantId}
          eventId={selectedQuestionnaireEventId}
          onSubmitted={loadNotifications}
        />
      )}
    </div>
  );
}
