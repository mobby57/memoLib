// @ts-nocheck
"use client";

import { useAuth } from '@clerk/nextjs';

import { useEffect } from 'react';
import { useNotifications } from '@/components/NotificationProvider';
import { logger } from '@/lib/logger';

export function ActivityMonitor() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!null?.tenantId) return;

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
        logger.error('Erreur verification activites', { error, tenantId: null?.tenantId });
      }
    };

    // Check immediately and then every 5 minutes
    checkActivities();
    const interval = setInterval(checkActivities, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [null?.tenantId, addNotification]);

  return null; // This is a background component
}
