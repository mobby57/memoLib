/**
 * Analytics abandon workflow
 *
 * Détecte et enregistre les abandons de formulaires et de workflows.
 * Les humains regardent les erreurs – l'IA voit les micro-abandons implicites.
 *
 * Usage :
 *   import { trackAbandonStep } from '@/lib/analytics/abandon-tracker'
 *   trackAbandonStep({ workflow: 'create_dossier', step: 'client_info', userId })
 */

export type AbandonEvent = {
  workflow: string;      // ex: 'create_dossier', 'email_to_dossier', 'document_generate'
  step: string;          // ex: 'client_info', 'ai_summary', 'confirm'
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
};

type AbandonSummary = {
  workflow: string;
  step: string;
  count: number;
  lastSeen: number;
};

const STORAGE_KEY = 'memolib:abandon_events';
const MAX_EVENTS = 500; // garder 500 derniers événements en mémoire

/**
 * Enregistre un abandon d'étape dans le workflow.
 * Sauvegarde côté client (localStorage) et envoie vers l'API analytics si disponible.
 */
export function trackAbandonStep(event: AbandonEvent): void {
  const e: AbandonEvent = {
    ...event,
    timestamp: event.timestamp ?? Date.now(),
  };

  // 1. Persistance locale (résilience hors-ligne)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const events: AbandonEvent[] = raw ? JSON.parse(raw) : [];
      events.push(e);
      // Limiter la taille
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // localStorage peut être bloqué en private browsing
    }
  }

  // 2. Envoi asynchrone vers l'API (fire-and-forget)
  if (typeof fetch !== 'undefined') {
    fetch('/api/analytics/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e),
      // keepalive permet l'envoi même si la page se ferme
      keepalive: true,
    }).catch(() => {
      // Silencieux – les données sont déjà dans localStorage
    });
  }
}

/**
 * Récupère un résumé agrégé des abandons depuis le localStorage.
 * Utile pour le debug côté dev ou pour afficher un rapport dans l'admin.
 */
export function getAbandonSummary(): AbandonSummary[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: AbandonEvent[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, AbandonSummary>();
    for (const e of events) {
      const key = `${e.workflow}::${e.step}`;
      const existing = map.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeen = Math.max(existing.lastSeen, e.timestamp ?? 0);
      } else {
        map.set(key, {
          workflow: e.workflow,
          step: e.step,
          count: 1,
          lastSeen: e.timestamp ?? Date.now(),
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/**
 * Efface les événements stockés localement (ex: après sync vers serveur).
 */
export function clearLocalAbandonEvents(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
