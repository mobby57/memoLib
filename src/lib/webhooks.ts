import crypto from 'crypto';
import { logger } from '@/lib/logger';

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
}

export async function sendWebhook(url: string, secret: string, payload: WebhookPayload) {
  const body = JSON.stringify(payload);
  const signature = createSignature(body, secret);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': payload.timestamp.toString()
      },
      body
    });

    return response.ok;
  } catch (error) {
    logger.error('echec livraison webhook', { error, url, event: payload.event });
    return false;
  }
}

function createSignature(body: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
}

export function triggerWebhooks(event: string, data: any, webhooks: any[]) {
  const payload: WebhookPayload = {
    event,
    data,
    timestamp: Date.now()
  };

  webhooks
    .filter(w => w.active && w.events.includes(event))
    .forEach(webhook => {
      sendWebhook(webhook.url, webhook.secret, payload);
    });
}