'use client';

import { useSessionTimeout } from '@/hooks/useSessionTimeout';

/**
 * Composant qui gère automatiquement l'expiration de session
 * - Déconnexion après 2h d'inactivité
 * - Avertissement 5 minutes avant expiration
 */
export function SessionTimeoutManager() {
  useSessionTimeout();
  return null; // Composant invisible, juste pour la logique
}
