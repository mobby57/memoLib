/**
 * Client Stripe pour memoLib
 * Gestion des paiements et abonnements
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('️ STRIPE_SECRET_KEY non definie - Paiements desactives');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Creer un client Stripe
 */
export async function createStripeCustomer(params: {
  email: string;
  name: string;
  tenantId: string;
  metadata?: Record<string, string>;
}) {
  return await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      tenantId: params.tenantId,
      ...params.metadata,
    },
  });
}

/**
 * Creer un abonnement Stripe
 */
export async function createStripeSubscription(params: {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}) {
  return await stripe.subscriptions.create({
    customer: params.customerId,
    items: [{ price: params.priceId }],
    trial_period_days: params.trialDays,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
    metadata: params.metadata,
  });
}

/**
 * Creer une session de checkout
 */
export async function createCheckoutSession(params: {
  priceId: string;
  customerId?: string;
  customerEmail?: string;
  tenantId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  return await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: params.customerId,
    customer_email: !params.customerId ? params.customerEmail : undefined,
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: params.trialDays,
      metadata: {
        tenantId: params.tenantId,
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });
}

/**
 * Creer un portail client
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  return await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: params.returnUrl,
  });
}

/**
 * Annuler un abonnement
 */
export async function cancelStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Mettre a jour un abonnement (upgrade/downgrade)
 */
export async function updateStripeSubscription(params: {
  subscriptionId: string;
  newPriceId: string;
  proration?: boolean;
}) {
  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);

  return await stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: params.newPriceId,
      },
    ],
    proration_behavior: params.proration !== false ? 'create_prorations' : 'none',
  });
}

/**
 * Recuperer les factures d'un client
 */
export async function getCustomerInvoices(customerId: string, limit = 10) {
  return await stripe.invoices.list({
    customer: customerId,
    limit,
  });
}

/**
 * Creer un prix Stripe pour un plan
 */
export async function createStripePrice(params: {
  productId: string;
  amount: number; // en centimes
  currency: string;
  interval: 'month' | 'year';
  nickname?: string;
}) {
  return await stripe.prices.create({
    product: params.productId,
    unit_amount: params.amount,
    currency: params.currency,
    recurring: {
      interval: params.interval,
    },
    nickname: params.nickname,
  });
}

/**
 * Creer un produit Stripe
 */
export async function createStripeProduct(params: {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}) {
  return await stripe.products.create({
    name: params.name,
    description: params.description,
    metadata: params.metadata,
  });
}
