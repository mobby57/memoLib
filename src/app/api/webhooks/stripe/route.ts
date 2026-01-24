/**
 * Webhook Stripe - Gestion des evenements de paiement
 * IMPORTANT: Cette route doit etre en mode RAW body (pas de parsing JSON automatique)
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/billing/stripe-client';
import { prisma } from '@/lib/prisma';

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
      console.error('Erreur verification webhook:', err);
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
        console.log(`evenement non gere: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Stripe:', error);
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
    console.error('Pas de tenantId dans metadata subscription');
    return;
  }

  // Mettre a jour la subscription dans la base
  await prisma.subscription.updateMany({
    where: { 
      tenantId,
      status: { in: ['active', 'trialing', 'past_due'] }
    },
    data: {
      status: 'active',
    }
  });

  // Creer la facture dans notre base
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { name: true }
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
      lineItems: JSON.stringify(invoice.lines.data.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.price?.unit_amount ? line.price.unit_amount / 100 : 0,
        total: line.amount / 100
      }))),
      metadata: JSON.stringify({
        stripe_invoice_id: invoice.id,
        stripe_payment_intent: invoice.payment_intent,
      })
    }
  });

  console.log(` Facture payee pour tenant ${tenant?.name || tenantId}`);
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
    data: { status: 'past_due' }
  });

  // TODO: Envoyer email d'alerte au tenant

  console.log(` echec paiement pour tenant ${tenantId}`);
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
    }
  });

  console.log(` Subscription creee pour tenant ${tenantId}`);
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
      status: subscription.status === 'active' ? 'active' : 
              subscription.status === 'trialing' ? 'trialing' : 
              subscription.status === 'past_due' ? 'past_due' : 'canceled',
    }
  });

  console.log(`[emoji] Subscription mise a jour pour tenant ${tenantId}`);
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
    }
  });

  console.log(`[emoji] Subscription annulee pour tenant ${tenantId}`);
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

  console.log(` Checkout complete pour tenant ${tenantId}`);
}
