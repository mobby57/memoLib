import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * POST /api/webhooks/clerk
 *
 * Reçoit les événements Clerk (user.created, user.updated, user.deleted).
 * Quand un utilisateur s'inscrit via une invitation, on le lie au Client Prisma.
 */
export async function POST(request: NextRequest) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('[CLERK WEBHOOK] CLERK_WEBHOOK_SECRET manquant');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }

  const payload = await request.text();
  const wh = new Webhook(secret);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    logger.error('[CLERK WEBHOOK] Signature invalide', { err });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const { type, data } = evt;

  if (type === 'user.created') {
    const email = data.email_addresses?.[0]?.email_address;
    const clerkUserId = data.id;

    if (!email) {
      logger.warn('[CLERK WEBHOOK] user.created sans email', { clerkUserId });
      return NextResponse.json({ received: true });
    }

    // Chercher un Client Prisma existant avec cet email
    const client = await prisma.client.findFirst({
      where: { email },
    });

    if (!client) {
      logger.warn('[CLERK WEBHOOK] Aucun Client Prisma pour cet email', { email, clerkUserId });
      return NextResponse.json({ received: true, linked: false });
    }

    // Verifier si un User existe deja avec cet email
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Lier le User existant au compte Clerk
      await prisma.user.update({
        where: { email },
        data: {
          clientId: client.id,
          role: 'CLIENT',
          tenantId: client.tenantId,
          updatedAt: new Date(),
        },
      });
      logger.info('[CLERK WEBHOOK] User existant lie au Client', { email, clientId: client.id });
    } else {
      // Creer le User
      await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || email,
          password: '',
          role: 'CLIENT',
          tenantId: client.tenantId,
          clientId: client.id,
          status: 'active',
          emailVerified: new Date(),
          updatedAt: new Date(),
        },
      });
      logger.info('[CLERK WEBHOOK] User CLIENT cree et lie', { email, clientId: client.id });
    }

    return NextResponse.json({ received: true, linked: true });
  }

  return NextResponse.json({ received: true });
}
