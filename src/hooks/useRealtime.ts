'use client';

/**
 * Hook React pour consommer les événements temps réel (SSE)
 */

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export type EventType =
  | 'dossier:created'
  | 'dossier:updated'
  | 'dossier:deleted'
  | 'notification:new'
  | 'message:new'
  | 'document:uploaded'
  | 'deadline:reminder'
  | 'system:alert'
  | 'stats:update'
  | 'connected';

interface SSEEvent {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: number;
}

interface UseRealtimeOptions {
  /** URL de l'endpoint SSE */
  url?: string;
  /** Événements à écouter (tous si non spécifié) */
  events?: EventType[];
  /** Afficher les notifications toast */
  showToasts?: boolean;
  /** Reconnexion automatique */
  autoReconnect?: boolean;
  /** Délai avant reconnexion (ms) */
  reconnectDelay?: number;
  /** Callback appelé pour chaque événement */
  onEvent?: (event: SSEEvent) => void;
  /** Callback appelé à la connexion */
  onConnect?: () => void;
  /** Callback appelé à la déconnexion */
  onDisconnect?: () => void;
  /** Callback appelé en cas d'erreur */
  onError?: (error: Event) => void;
}

interface UseRealtimeReturn {
  /** État de connexion */
  isConnected: boolean;
  /** Dernière erreur */
  error: Error | null;
  /** Dernier événement reçu */
  lastEvent: SSEEvent | null;
  /** Compteur d'événements reçus */
  eventCount: number;
  /** Reconnecter manuellement */
  reconnect: () => void;
  /** Déconnecter */
  disconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    url = '/api/realtime/events',
    events,
    showToasts = true,
    autoReconnect = true,
    reconnectDelay = 5000,
    onEvent,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const handleEvent = useCallback(
    (event: MessageEvent) => {
      try {
        const sseEvent: SSEEvent = JSON.parse(event.data);

        // Filtrer si des événements spécifiques sont demandés
        if (events && !events.includes(sseEvent.type)) {
          return;
        }

        setLastEvent(sseEvent);
        setEventCount(prev => prev + 1);

        // Callback personnalisé
        onEvent?.(sseEvent);

        // Notifications toast
        if (showToasts) {
          handleToastNotification(sseEvent);
        }
      } catch (e) {
        console.error('[SSE] Erreur parsing événement:', e);
      }
    },
    [events, onEvent, showToasts]
  );

  const handleToastNotification = (event: SSEEvent) => {
    switch (event.type) {
      case 'notification:new':
        toast.info((event.data.message as string) || 'Nouvelle notification');
        break;
      case 'message:new':
        toast.info(`Nouveau message de ${event.data.sender || 'inconnu'}`);
        break;
      case 'dossier:created':
        toast.success(`Dossier créé: ${event.data.reference || 'Nouveau dossier'}`);
        break;
      case 'deadline:reminder':
        toast.warning(`⚠️ Échéance proche: ${event.data.dossierRef || ''}`);
        break;
      case 'system:alert':
        toast.error((event.data.message as string) || 'Alerte système');
        break;
      // Autres événements ne génèrent pas de toast
    }
  };

  const connect = useCallback(() => {
    // Ne pas connecter si pas de session
    if (status !== 'authenticated' || !session) {
      return;
    }

    // Fermer la connexion existante
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[SSE] Connexion établie');
        setIsConnected(true);
        setError(null);
        onConnect?.();
      };

      eventSource.onerror = e => {
        console.error('[SSE] Erreur connexion:', e);
        setIsConnected(false);
        setError(new Error('Connexion perdue'));
        onError?.(e);
        onDisconnect?.();

        // Reconnexion automatique
        if (autoReconnect && shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[SSE] Tentative de reconnexion...');
            connect();
          }, reconnectDelay);
        }
      };

      // Écouter l'événement de connexion
      eventSource.addEventListener('connected', handleEvent);

      // Écouter tous les types d'événements
      const eventTypes: EventType[] = [
        'dossier:created',
        'dossier:updated',
        'dossier:deleted',
        'notification:new',
        'message:new',
        'document:uploaded',
        'deadline:reminder',
        'system:alert',
        'stats:update',
      ];

      for (const eventType of eventTypes) {
        eventSource.addEventListener(eventType, handleEvent);
      }
    } catch (e) {
      console.error('[SSE] Erreur création EventSource:', e);
      setError(e as Error);
    }
  }, [
    url,
    status,
    session,
    autoReconnect,
    reconnectDelay,
    handleEvent,
    onConnect,
    onDisconnect,
    onError,
  ]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Connexion automatique quand l'utilisateur est authentifié
  useEffect(() => {
    if (status === 'authenticated') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [status, connect, disconnect]);

  // Reconnexion lors du retour de la page visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && status === 'authenticated') {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, status, reconnect]);

  return {
    isConnected,
    error,
    lastEvent,
    eventCount,
    reconnect,
    disconnect,
  };
}

/**
 * Hook simplifié pour écouter un type d'événement spécifique
 */
export function useRealtimeEvent<T = Record<string, unknown>>(
  eventType: EventType,
  callback: (data: T) => void
): { isConnected: boolean } {
  const { isConnected } = useRealtime({
    events: [eventType],
    showToasts: false,
    onEvent: event => {
      if (event.type === eventType) {
        callback(event.data as T);
      }
    },
  });

  return { isConnected };
}

export default useRealtime;
