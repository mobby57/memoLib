'use client';

import { useSessionTimeout } from '@/hooks/useSessionTimeout';

/**
 * Composant qui gere automatiquement l'expiration de session
 * - Deconnexion apres 2h d'inactivite
 * - Avertissement 5 minutes avant expiration
 */
export function SessionTimeoutManager() {
  useSessionTimeout();
  return null; // Composant invisible, juste pour la logique
}
