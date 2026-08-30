import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Redis } from '@upstash/redis';

type ConfiguredWebhookSecret = string & { __brand: 'ConfiguredWebhookSecret' };

export type ParsedStripeWebhookRequest =
  | {
      ok: true;
      event: Stripe.Event;
      body: string;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export function isStripeWebhookSecretConfigured(webhookSecret: string | undefined): boolean {
  return Boolean(
    webhookSecret && webhookSecret.startsWith('whsec_') && webhookSecret !== 'whsec_placeholder'
  );
}

function getConfiguredWebhookSecret(
  webhookSecret: string | undefined
): ConfiguredWebhookSecret | null {
  if (!isStripeWebhookSecretConfigured(webhookSecret)) {
    return null;
  }

  return webhookSecret as ConfiguredWebhookSecret;
}

export function getStripeWebhookConfigurationStatus(): number {
  return process.env.NODE_ENV === 'production' ? 503 : 400;
}

export async function parseStripeWebhookRequest(
  request: NextRequest,
  stripeClient: Stripe,
  webhookSecret: string | undefined
): Promise<ParsedStripeWebhookRequest> {
  const configuredWebhookSecret = getConfiguredWebhookSecret(webhookSecret);

  if (!configuredWebhookSecret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Stripe webhook configuration missing' },
        { status: getStripeWebhookConfigurationStatus() }
      ),
    };
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 }),
    };
  }

  const body = await request.text();

  try {
    const event = stripeClient.webhooks.constructEvent(body, signature, configuredWebhookSecret);
    return { ok: true, event, body };
  } catch {
    console.error('[stripe-webhook] signature verification failed');
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 }),
    };
  }
}

export function logStripeWebhookProcessingFailure(eventType?: string): void {
  console.error('[stripe-webhook] event handling failed', {
    eventType: eventType || 'unknown',
  });
}

const processedEventIds = new Map<string, number>();

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Returns true when the event id was already seen (duplicate/replay).
 * Uses persistent Redis NX lock when available, with in-memory fallback for local dev.
 */
export async function isStripeEventDuplicate(eventId: string): Promise<boolean> {
  const key = `stripe:webhook:event:${eventId}`;
  const ttlSeconds = 60 * 60 * 24 * 7; // 7 days

  try {
    const redis = getRedisClient();

    if (redis) {
      const result = await redis.set(key, '1', { nx: true, ex: ttlSeconds });
      return result !== 'OK';
    }
  } catch {
    // Fall through to in-memory fallback.
  }

  const now = Date.now();
  const existing = processedEventIds.get(eventId);
  if (existing && existing > now) {
    return true;
  }

  processedEventIds.set(eventId, now + ttlSeconds * 1000);
  return false;
}
