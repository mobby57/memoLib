import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { logger } from '@/lib/logger';

/**
 * Vérifie la signature HMAC SHA256 du webhook GitHub
 */
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = 'sha256=' + createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');
    
    if (!signature || !event) {
      logger.warn('Webhook GitHub sans signature/event', { hasSignature: !!signature, event });
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const rawBody = await request.text();
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (!secret) {
      logger.error('GITHUB_WEBHOOK_SECRET non configuré');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature, secret)) {
      logger.error('Signature webhook GitHub invalide', { event, delivery });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    
    logger.info('Webhook GitHub reçu', {
      event,
      delivery,
      repository: payload.repository?.full_name,
      sender: payload.sender?.login
    });

    // Traitement selon le type d'événement
    switch (event) {
      case 'push':
        logger.info('Push GitHub', {
          repository: payload.repository?.full_name,
          branch: payload.ref?.replace('refs/heads/', ''),
          commits: payload.commits?.length
        });
        break;

      case 'pull_request':
        logger.info('Pull Request GitHub', {
          action: payload.action,
          number: payload.pull_request?.number,
          title: payload.pull_request?.title
        });
        break;

      case 'issues':
        logger.info('Issue GitHub', {
          action: payload.action,
          number: payload.issue?.number,
          title: payload.issue?.title,
          labels: payload.issue?.labels?.map((l: any) => l.name)
        });
        break;

      case 'ping':
        logger.debug('Webhook GitHub ping reçu', { zen: payload.zen });
        break;

      default:
        logger.debug('Événement GitHub non géré', { event });
    }

    return NextResponse.json({ success: true, event, delivery });
  } catch (error) {
    logger.error('Erreur traitement webhook GitHub', { error });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    supported_events: ['push', 'pull_request', 'issues', 'ping']
  });
}
