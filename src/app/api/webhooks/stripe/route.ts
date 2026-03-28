/**
 * Webhook Stripe - Gestion des evenements de paiement
 * IMPORTANT: Cette route doit etre en mode RAW body (pas de parsing JSON automatique)
 */

import { stripe } from '@/lib/billing/stripe-client';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { isStripeEventDuplicate } from '@/lib/stripe/webhook';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const requestHeaders = await headers();
    const signature = requestHeaders.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Pas de signature' }, { status: 400 });
    }

    // Verifier la signature du webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error('Erreur verification webhook', err instanceof Error ? err : undefined, {
        route: '/api/webhooks/stripe',
      });
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    if (await isStripeEventDuplicate(event.id)) {
      logger.info(`Webhook Stripe ignore (replay): ${event.id}`, {
        route: '/api/webhooks/stripe',
        eventType: event.type,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Traiter l'evenement
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        logger.debug(`evenement non gere: ${event.type}`, { route: '/api/webhooks/stripe' });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Erreur webhook Stripe', error instanceof Error ? error : undefined, {
      route: '/api/webhooks/stripe',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * Facture payee - Mettre a jour dans la base
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId =
    typeof invoiceData.subscription === 'string'
      ? invoiceData.subscription
      : invoiceData.subscription?.id;
  if (!subscriptionId) return;

  // Recuperer la subscription Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = stripeSubscription.metadata.tenantId;

  if (!tenantId) {
    logger.error('Pas de tenantId dans metadata subscription', undefined, {
      route: '/api/webhooks/stripe',
    });
    return;
  }

  // Mettre a jour la subscription dans la base
  await prisma.subscription.updateMany({
    where: {
      tenantId,
      status: { in: ['active', 'trialing', 'past_due'] },
    },
    data: {
      status: 'active',
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  await prisma.facture.updateMany({
    where: { tenantId, stripeInvoiceId: invoice.id },
    data: {
      statut: 'payee',
      datePaiement: new Date(),
      referencePayment:
        typeof invoiceData.payment_intent === 'string'
          ? invoiceData.payment_intent
          : invoiceData.payment_intent?.id,
    },
  });

  logger.info(`Facture payee pour tenant ${tenant?.name || tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}

/**
 * echec de paiement - Marquer comme past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId =
    typeof invoiceData.subscription === 'string'
      ? invoiceData.subscription
      : invoiceData.subscription?.id;
  if (!subscriptionId) return;

  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = stripeSubscription.metadata.tenantId;

  if (!tenantId) return;

  await prisma.subscription.updateMany({
    where: { tenantId },
    data: { status: 'past_due' },
  });

  // Envoyer email d'alerte au tenant
  try {
    const billingContact = await prisma.user.findFirst({
      where: { tenantId, role: { in: ['OWNER', 'ADMIN', 'AVOCAT'] } },
      select: { email: true, name: true },
      orderBy: { createdAt: 'asc' },
    });

    if (billingContact?.email) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'billing@memoLib.com',
          to: billingContact.email,
          subject: '⚠️ Action requise : Échec de paiement - memoLib',
          html: `
            <h2>Échec de paiement</h2>
            <p>Nous n'avons pas pu traiter votre paiement pour l'abonnement ${billingContact.name ?? tenantId}.</p>
            <p>Veuillez mettre à jour vos informations de paiement pour éviter une interruption de service.</p>
            <a href="${process.env.NEXTAUTH_URL}/settings/billing" style="background:#dc2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">Mettre à jour le paiement</a>
          `,
        });
      }
    }
  } catch (emailError) {
    logger.error('Erreur envoi email alerte paiement', { error: emailError, tenantId });
  }

  logger.warn(`echec paiement pour tenant ${tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}

/**
 * Subscription creee
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) return;

  // La subscription devrait deja exister (creee lors du checkout)
  // On met juste a jour le statut
  await prisma.subscription.updateMany({
    where: { tenantId },
    data: {
      status: subscription.status === 'trialing' ? 'trialing' : 'active',
    },
  });

  logger.info(`Subscription creee pour tenant ${tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}

/**
 * Subscription mise a jour (upgrade/downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) return;

  await prisma.subscription.updateMany({
    where: { tenantId },
    data: {
      status:
        subscription.status === 'active'
          ? 'active'
          : subscription.status === 'trialing'
            ? 'trialing'
            : subscription.status === 'past_due'
              ? 'past_due'
              : 'canceled',
    },
  });

  logger.info(`Subscription mise a jour pour tenant ${tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}

/**
 * Subscription annulee
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) return;

  await prisma.subscription.updateMany({
    where: { tenantId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  logger.info(`Subscription annulee pour tenant ${tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}

/**
 * Checkout complete - Creer la subscription dans la base
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const tenantId = subscription.metadata.tenantId;

  if (!tenantId) return;

  logger.info(`Checkout complete pour tenant ${tenantId}`, {
    route: '/api/webhooks/stripe',
    tenantId,
  });
}
