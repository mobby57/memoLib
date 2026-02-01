import { NextRequest } from 'next/server';
import { registerSSEClient, unregisterSSEClient } from '@/lib/notifications';

// GET - Stream SSE pour les notifications en temps reel
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response('userId requis', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Enregistrer ce client
      registerSSEClient(userId, controller);

      // Envoyer un heartbeat initial
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`: heartbeat\n\n`));

      // Heartbeat toutes les 30 secondes pour garder la connexion active
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup lors de la fermeture
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unregisterSSEClient(userId, controller);
        try {
          controller.close();
        } catch {
          // Deja ferme
        }
      });
    },
    cancel() {
      // Stream annule par le client
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
