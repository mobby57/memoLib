/**
 * Clerk Webhook Handler — MemoLib
 * Reçoit les événements Clerk et synchronise avec Prisma.
 * Auto-provisioning : crée un tenant si l'utilisateur n'en a pas.
 */

import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    logger.error('[Clerk Webhook] CLERK_WEBHOOK_SECRET manquant');
    return NextResponse.json({ error: 'Config manquante' }, { status: 500 });
  }

  const headersList = await headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Headers Svix manquants' }, { status: 400 });
  }

  const payload = await request.text();
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    logger.error('[Clerk Webhook] Signature invalide', err as Error);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const eventType = evt.type;
  const data = evt.data;

  try {
    if (eventType === 'user.created') await handleUserCreated(data);
    else if (eventType === 'user.updated') await handleUserUpdated(data);
    else if (eventType === 'user.deleted') await handleUserDeleted(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(`[Clerk Webhook] Erreur ${eventType}`, error as Error);
    return NextResponse.json({ error: 'Erreur traitement' }, { status: 500 });
  }
}

async function handleUserCreated(data: any) {
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || '';
  const lastName = data.last_name || '';
  const name = `${firstName} ${lastName}`.trim() || email;

  if (!email) return;

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    logger.info(`[Clerk Webhook] User ${email} existe déjà`);
    return;
  }

  let tenantId = (data.public_metadata?.tenantId as string) || null;
  let role = (data.public_metadata?.role as string) || null;

  // Auto-provisioning : créer un cabinet si l'utilisateur n'en a pas
  if (!tenantId) {
    logger.info(`[Clerk Webhook] Auto-provisioning tenant pour ${email}`);

    let plan = await prisma.plan.findFirst({ where: { name: 'STARTER' } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          id: randomUUID(),
          name: 'STARTER',
          displayName: 'Starter (Gratuit)',
          priceMonthly: 0,
          priceYearly: 0,
          updatedAt: new Date(),
        },
      });
    }

    const newTenant = await prisma.tenant.create({
      data: {
        id: randomUUID(),
        name: `Cabinet de ${name}`,
        subdomain: `cabinet-${data.id.slice(-8)}`,
        planId: plan.id,
        status: 'active',
        updatedAt: new Date(),
      },
    });

    tenantId = newTenant.id;
    role = role || 'ADMIN';

    try {
      const { clerkClient } = await import('@clerk/nextjs/server');
      await clerkClient.users.updateUserMetadata(data.id, {
        publicMetadata: { ...data.public_metadata, role, tenantId },
      });
    } catch (err) {
      logger.warn('[Clerk Webhook] Update metadata Clerk échoué', err as Error);
    }
  }

  role = role || 'CLIENT';

  await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      name,
      role,
      tenantId,
      updatedAt: new Date(),
    },
  });

  logger.info(`[Clerk Webhook] ✅ User créé : ${email} (${role}) tenant=${tenantId}`);
}

async function handleUserUpdated(data: any) {
  const email = data.email_addresses?.[0]?.email_address;
  if (!email) return;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || user.name,
      role: (data.public_metadata?.role as string) || user.role,
      tenantId: (data.public_metadata?.tenantId as string) || user.tenantId,
      updatedAt: new Date(),
    },
  });

  logger.info(`[Clerk Webhook] User mis à jour : ${email}`);
}

async function handleUserDeleted(data: any) {
  const email = data.email_addresses?.[0]?.email_address;
  if (!email) return;

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { status: 'deleted', updatedAt: new Date() },
  });

  logger.info(`[Clerk Webhook] User désactivé : ${email}`);
}
