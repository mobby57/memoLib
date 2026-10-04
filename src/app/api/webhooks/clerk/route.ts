/**
 * Webhook Clerk — provisioning a la creation de compte (M1, tout-Clerk).
 * verifyWebhook (@clerk/nextjs/webhooks) verifie la signature via
 * CLERK_WEBHOOK_SIGNING_SECRET. Route exclue du clerkMiddleware (voir middleware.ts).
 */

import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  provisionFromClerk,
  syncFromClerk,
  softDeleteFromClerk,
} from '@/lib/services/saas-provisioning';

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    logger.error('[Webhook Clerk] Signature invalide', err instanceof Error ? err : undefined, {
      route: '/api/webhooks/clerk',
    });
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case 'user.created':
        await provisionFromClerk(evt.data);
        break;
      case 'user.updated':
        await syncFromClerk(evt.data);
        break;
      case 'user.deleted':
        await softDeleteFromClerk(evt.data);
        break;
      default:
        break;
    }
  } catch (err) {
    logger.error('[Webhook Clerk] Traitement echoue', err instanceof Error ? err : undefined, {
      route: '/api/webhooks/clerk',
      eventType: evt.type,
    });
    // 500 -> Clerk retente. provisionFromClerk est idempotent.
    return NextResponse.json({ error: 'Traitement echoue' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
