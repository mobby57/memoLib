'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    const protocol = window.location.protocol;
    const isHttpLike = protocol === 'https:' || protocol === 'http:';

    if (!isHttpLike) {
      logger.debug('Service Worker ignore: protocole non compatible', { protocol });
      return;
    }

    if (document.visibilityState === 'hidden') {
      logger.debug('Service Worker ignore: document prerender');
      return;
    }

    // TEMPORARILY DISABLED - causing CSP caching issues
    // Re-enable after CSP issues resolved
    if ('serviceWorker' in navigator) {
      // Unregister all existing service workers to clear cache
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
            logger.debug('Service Worker desactive temporairement');
          }
        })
        .catch((error) => {
          logger.debug('Service Worker ignore: API indisponible dans ce contexte', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    /* ORIGINAL CODE - DISABLED
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.debug('Service Worker enregistre', { scope: registration.scope });

          // Verifier les mises a jour
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
          logger.error('echec enregistrement Service Worker', { error });
        });
    }
    */
  }, []);

  return null;
}
