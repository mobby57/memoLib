// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement useSession() -> useUser()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement useUser() -> useUser()
// CLERK-MIGRATION: Remplacement import useSession
'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useNotifications } from '@/components/NotificationProvider';
import { logger } from '@/lib/logger';

export function ActivityMonitor() {
  const { data: session } = useUser();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!session?.user?.tenantId) return;

    const checkActivities = async () => {
      try {
        // Check for urgent deadlines
        const response = await fetch(`/api/tenant/${user.tenantId}/suggestions`);
        if (response.ok) {
          const data = await response.json();
          
          data.suggestions.forEach((suggestion: any) => {
            if (suggestion.priority === 'critical') {
              addNotification({
                type: 'error',
                title: 'echeance critique',
                message: suggestion.title
              });
            } else if (suggestion.priority === 'high') {
              addNotification({
                type: 'warning',
                title: 'Action recommandee',
                message: suggestion.title
              });
            }
          });
        }
      } catch (error) {
        logger.error('Erreur verification activites', { error, tenantId: session?.user?.tenantId });
      }
    };

    // Check immediately and then every 5 minutes
    checkActivities();
    const interval = setInterval(checkActivities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.tenantId, addNotification]);

  return null; // This is a background component
}





