/**
 * Webhook Stripe - Gestion des evenements de paiement
 * IMPORTANT: Cette route doit etre en mode RAW body (pas de parsing JSON automatique)
 */

import { stripe } from '@/lib/billing/stripe-client';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

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
  const subscriptionId = invoice.subscription as string;
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

  // Creer la facture dans notre base
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true },
  });

  await prisma.invoice.create({
    data: {
      tenantId,
      subscriptionId: stripeSubscription.id,
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      subtotal: invoice.subtotal / 100, // Stripe en centimes
      tax: (invoice.tax || 0) / 100,
      total: invoice.total / 100,
      status: 'paid',
      issueDate: new Date(invoice.created * 1000),
      dueDate: new Date(invoice.due_date ? invoice.due_date * 1000 : Date.now()),
      paidAt: new Date(),
      billingEmail: invoice.customer_email || undefined,
      lineItems: JSON.stringify(
        invoice.lines.data.map(line => ({
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.price?.unit_amount ? line.price.unit_amount / 100 : 0,
          total: line.amount / 100,
        }))
      ),
      metadata: JSON.stringify({
        stripe_invoice_id: invoice.id,
        stripe_payment_intent: invoice.payment_intent,
      }),
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
  const subscriptionId = invoice.subscription as string;
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
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { owner: true },
    });
    if (tenant?.owner?.email) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'billing@iapostemanager.com',
          to: tenant.owner.email,
          subject: '⚠️ Action requise : Échec de paiement - IA Poste Manager',
          html: `
            <h2>Échec de paiement</h2>
            <p>Nous n'avons pas pu traiter votre paiement pour l'abonnement ${tenant.name}.</p>
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
