'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotifications } from '@/components/NotificationProvider';
import { logger } from '@/lib/logger';

export function ActivityMonitor() {
  const { data: session } = useSession();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const checkActivities = async () => {
      try {
        // Check for urgent deadlines
        const response = await fetch(`/api/tenant/${session.user.tenantId}/suggestions`);
        if (response.ok) {
          const data = await response.json();
          
          data.suggestions.forEach((suggestion: any) => {
            if (suggestion.priority === 'critical') {
              addNotification({
                type: 'error',
                title: 'Échéance critique',
                message: suggestion.title
              });
            } else if (suggestion.priority === 'high') {
              addNotification({
                type: 'warning',
                title: 'Action recommandée',
                message: suggestion.title
              });
            }
          });
        }
      } catch (error) {
        logger.error('Erreur vérification activités', { error, tenantId: session?.user?.tenantId });
      }
    };

    // Check immediately and then every 5 minutes
    checkActivities();
    const interval = setInterval(checkActivities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.tenantId, addNotification]);

  return null; // This is a background component
}