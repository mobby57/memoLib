/**
 * ws-emit — Pont d'émission App (Vercel) -> serveur WebSocket (Railway).
 *
 * L'app Next.js s'exécute en serverless sur Vercel : elle ne peut PAS garder
 * de connexions Socket.IO en mémoire. Pour pousser une notification temps réel,
 * on effectue un POST HTTP signé vers le serveur Socket.IO (Railway), qui relaie
 * l'événement aux clients de la room concernée.
 *
 * Config requise (côté app, ex. Vercel env):
 *  - WS_SERVER_URL  : URL interne du serveur WS (peut = NEXT_PUBLIC_WS_URL).
 *  - WS_EMIT_SECRET : secret partagé avec le serveur WS (header x-emit-secret).
 *
 * Fire-and-forget : une panne du canal temps réel ne doit jamais casser
 * l'ingestion d'email ni une requête API. Les erreurs sont loggées, pas levées.
 */

import { logger } from '@/lib/logger';
import type {
  EmailNotification,
  DossierNotification,
  DeadlineAlert,
  SystemNotification,
} from '@/lib/websocket';

type EmitTarget =
  | { target: 'tenant'; id: string }
  | { target: 'user'; id: string }
  | { target: 'all' };

interface EmitPayload extends Partial<Record<'id', string>> {
  target: 'tenant' | 'user' | 'all';
  event: string;
  data: unknown;
}

function getConfig(): { url: string; secret: string } | null {
  const url = process.env.WS_SERVER_URL || process.env.NEXT_PUBLIC_WS_URL;
  const secret = process.env.WS_EMIT_SECRET;
  if (!url || !secret) {
    return null;
  }
  return { url: url.replace(/\/$/, ''), secret };
}

/**
 * Envoie un événement au serveur WS. Ne lève jamais (best-effort).
 */
export async function wsEmit(destination: EmitTarget, event: string, data: unknown): Promise<void> {
  const config = getConfig();
  if (!config) {
    // Realtime non configuré — silencieux en prod, warn en dev.
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[ws-emit] WS_SERVER_URL / WS_EMIT_SECRET manquant — notif ignorée', {
        event,
      });
    }
    return;
  }

  const payload: EmitPayload = {
    target: destination.target,
    event,
    data,
    ...('id' in destination ? { id: destination.id } : {}),
  };

  try {
    const res = await fetch(`${config.url}/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-emit-secret': config.secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      logger.warn('[ws-emit] Émission refusée par le serveur WS', {
        status: res.status,
        event,
      });
    }
  } catch (error) {
    logger.warn('[ws-emit] Échec émission WS', {
      event,
      error: error instanceof Error ? error.message : 'unknown',
    });
  }
}

// ============================================================
// Helpers typés (remplacent les notify* in-memory de lib/websocket)
// ============================================================

export function notifyEmailReceived(tenantId: string, email: EmailNotification): Promise<void> {
  return wsEmit({ target: 'tenant', id: tenantId }, 'email-received', email);
}

export function notifyDossierUpdated(tenantId: string, dossier: DossierNotification): Promise<void> {
  return wsEmit({ target: 'tenant', id: tenantId }, 'dossier-updated', dossier);
}

export function notifyDeadlineAlert(userId: string, alert: DeadlineAlert): Promise<void> {
  return wsEmit({ target: 'user', id: userId }, 'deadline-alert', alert);
}

export function notifySystem(tenantId: string, notification: SystemNotification): Promise<void> {
  return wsEmit({ target: 'tenant', id: tenantId }, 'system-notification', notification);
}
