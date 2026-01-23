'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // TEMPORARILY DISABLED - causing CSP caching issues
    // TODO: Re-enable after cache issues are resolved
    if ('serviceWorker' in navigator) {
      // Unregister all existing service workers to clear cache
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          logger.debug('Service Worker désactivé temporairement');
        }
      });
    }
    
    /* ORIGINAL CODE - DISABLED
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.debug('Service Worker enregistré', { scope: registration.scope });
          
          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouvelle version disponible
                  if (confirm('Une nouvelle version est disponible. Recharger ?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error('Échec enregistrement Service Worker', { error });
        });
    }
    */
  }, []);

  return null;
}
