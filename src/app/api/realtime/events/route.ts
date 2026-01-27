/**
 * API Route pour les événements en temps réel (SSE)
 * Permet aux clients de recevoir des mises à jour en temps réel
 */

import { authOptions } from '@/lib/auth/authOptions';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

// Store des connexions SSE actives par utilisateur
const clients = new Map<string, Set<ReadableStreamDefaultController>>();

// Types d'événements supportés
export type EventType =
  | 'dossier:created'
  | 'dossier:updated'
  | 'dossier:deleted'
  | 'notification:new'
  | 'message:new'
  | 'document:uploaded'
  | 'deadline:reminder'
  | 'system:alert'
  | 'stats:update';

interface SSEEvent {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * Publier un événement à tous les clients connectés
 */
export function publishEvent(
  event: EventType,
  data: Record<string, unknown>,
  targetUserIds?: string[]
): void {
  const sseEvent: SSEEvent = {
    type: event,
    data,
    timestamp: Date.now(),
  };

  const eventString = `event: ${event}\ndata: ${JSON.stringify(sseEvent)}\n\n`;

  if (targetUserIds && targetUserIds.length > 0) {
    // Envoyer seulement aux utilisateurs ciblés
    for (const userId of targetUserIds) {
      const userClients = clients.get(userId);
      if (userClients) {
        for (const controller of userClients) {
          try {
            controller.enqueue(new TextEncoder().encode(eventString));
          } catch (e) {
            // Le client s'est probablement déconnecté
            userClients.delete(controller);
          }
        }
      }
    }
  } else {
    // Broadcast à tous
    for (const [, userClients] of clients) {
      for (const controller of userClients) {
        try {
          controller.enqueue(new TextEncoder().encode(eventString));
        } catch (e) {
          userClients.delete(controller);
        }
      }
    }
  }
}

/**
 * Publier un événement à un tenant spécifique
 */
export function publishToTenant(
  tenantId: string,
  event: EventType,
  data: Record<string, unknown>
): void {
  // TODO: Filtrer les utilisateurs par tenant
  publishEvent(event, { ...data, tenantId });
}

/**
 * Handler GET pour les connexions SSE
 */
export async function GET(req: NextRequest) {
  // Vérifier l'authentification
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response('Non autorisé', { status: 401 });
  }

  const userId = session.user.id;

  // Créer le stream SSE
  const stream = new ReadableStream({
    start(controller) {
      // Enregistrer le client
      if (!clients.has(userId)) {
        clients.set(userId, new Set());
      }
      clients.get(userId)!.add(controller);

      // Message de connexion
      const connectEvent = `event: connected\ndata: ${JSON.stringify({
        userId,
        timestamp: Date.now(),
        message: 'Connexion établie',
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectEvent));

      // Heartbeat toutes les 30 secondes
      const heartbeat = setInterval(() => {
        try {
          const ping = `: heartbeat ${Date.now()}\n\n`;
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup à la déconnexion
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        const userClients = clients.get(userId);
        if (userClients) {
          userClients.delete(controller);
          if (userClients.size === 0) {
            clients.delete(userId);
          }
        }
      });
    },

    cancel() {
      // Cleanup si le stream est annulé
      const userClients = clients.get(userId);
      if (userClients) {
        for (const controller of userClients) {
          try {
            controller.close();
          } catch {
            // Ignorer
          }
        }
        clients.delete(userId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Désactiver le buffering nginx
    },
  });
}

/**
 * Handler POST pour envoyer des événements (usage interne)
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Seulement les admins peuvent publier des événements
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role as string)) {
    return new Response('Non autorisé', { status: 403 });
  }

  try {
    const { event, data, targetUserIds } = await req.json();

    if (!event || !data) {
      return Response.json({ error: 'Event et data requis' }, { status: 400 });
    }

    publishEvent(event as EventType, data, targetUserIds);

    return Response.json({
      success: true,
      clientsCount: Array.from(clients.values()).reduce((acc, set) => acc + set.size, 0),
    });
  } catch (error) {
    console.error('[SSE] Erreur publication:', error);
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Export pour utilisation depuis d'autres modules
export { clients };
