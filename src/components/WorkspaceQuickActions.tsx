'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/NotificationProvider';
import { FileText, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => Promise<void>;
}

export function WorkspaceQuickActions({ dossierId }: { dossierId?: string }) {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState<string | null>(null);

  const executeAction = async (actionId: string, actionFn: () => Promise<void>) => {
    setLoading(actionId);
    try {
      await actionFn();
      addNotification({
        type: 'success',
        title: 'Action réalisée',
        message: 'L\'action a été exécutée avec succès'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible d\'exécuter l\'action'
      });
    } finally {
      setLoading(null);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-document',
      label: 'Ajouter Document',
      icon: FileText,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: async () => {
        // Simulate document upload
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    },
    {
      id: 'set-reminder',
      label: 'Programmer Rappel',
      icon: Clock,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: async () => {
        if (!session?.user?.tenantId) return;
        
        const response = await fetch(`/api/tenant/${session.user.tenantId}/quick-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_reminder',
            data: { dossierId, date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
          })
        });
        
        if (!response.ok) throw new Error('Failed to create reminder');
      }
    },
    {
      id: 'mark-complete',
      label: 'Marquer Terminé',
      icon: CheckCircle,
      color: 'bg-green-500 hover:bg-green-600',
      action: async () => {
        if (!session?.user?.tenantId || !dossierId) return;
        
        const response = await fetch(`/api/tenant/${session.user.tenantId}/quick-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_dossier_status',
            data: { dossierId, statut: 'termine' }
          })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
      }
    },
    {
      id: 'flag-urgent',
      label: 'Marquer Urgent',
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600',
      action: async () => {
        if (!session?.user?.tenantId || !dossierId) return;
        
        const response = await fetch(`/api/tenant/${session.user.tenantId}/quick-actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_dossier_priority',
            data: { dossierId, priorite: 'critique' }
          })
        });
        
        if (!response.ok) throw new Error('Failed to update priority');
      }
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5" />
        Actions Rapides
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isLoading = loading === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action.id, action.action)}
              disabled={isLoading}
              className={`${action.color} text-white p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
