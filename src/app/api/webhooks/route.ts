import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-hub-signature-256');

    // Verifier la signature webhook GitHub
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || !signature || !verifyGitHubSignature(body, signature, secret)) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const { event, data } = payload;

    // Traiter l'evenement webhook
    await processWebhookEvent(event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur webhook', error instanceof Error ? error : undefined, {
      route: '/api/webhooks',
    });
    return NextResponse.json({ error: 'echec du traitement webhook' }, { status: 500 });
  }
}

function verifyGitHubSignature(body: string, signature: string, secret: string): boolean {
  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

async function processWebhookEvent(event: string, data: any) {
  switch (event) {
    case 'dossier.created':
      logger.info('Nouveau dossier cree', { route: '/api/webhooks', dossierId: data.dossierId });
      break;
    case 'dossier.updated':
      logger.info('Dossier mis a jour', { route: '/api/webhooks', dossierId: data.dossierId });
      break;
    case 'payment.completed':
      logger.info('Paiement complete', { route: '/api/webhooks', paymentId: data.paymentId });
      break;
    case 'document.uploaded':
      logger.info('Document telecharge', { route: '/api/webhooks', documentId: data.documentId });
      break;
    default:
      logger.debug(`evenement webhook non gere: ${event}`, { route: '/api/webhooks' });
  }
}
