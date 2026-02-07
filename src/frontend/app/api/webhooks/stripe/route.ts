import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const prisma = new PrismaClient();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) return;

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine plan based on price
  const priceId = subscription.items.data[0].price.id;
  let plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
  let maxClients = 5;
  let maxDossiers = 10;
  let maxStorage = 1024;
  let hasAIFeatures = false;
  let hasAdvancedReports = false;
  let hasAPIAccess = false;
  let hasPrioritySupport = false;

  if (priceId.includes("pro")) {
    plan = "PRO";
    maxClients = 50;
    maxDossiers = 500;
    maxStorage = 51200;
    hasAIFeatures = true;
    hasAdvancedReports = true;
    hasAPIAccess = false;
    hasPrioritySupport = true;
  } else if (priceId.includes("enterprise")) {
    plan = "ENTERPRISE";
    maxClients = 999999;
    maxDossiers = 999999;
    maxStorage = 512000;
    hasAIFeatures = true;
    hasAdvancedReports = true;
    hasAPIAccess = true;
    hasPrioritySupport = true;
  }

  // Create or update subscription in database
  await prisma.billingSubscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      status: subscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      maxClients,
      maxDossiers,
      maxStorage,
      hasAIFeatures,
      hasAdvancedReports,
      hasAPIAccess,
      hasPrioritySupport,
      metadata: JSON.stringify(subscription.metadata),
    },
    update: {
      plan,
      status: subscription.status === "trialing" ? "TRIALING" : "ACTIVE",
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: false,
      maxClients,
      maxDossiers,
      maxStorage,
      hasAIFeatures,
      hasAdvancedReports,
      hasAPIAccess,
      hasPrioritySupport,
      metadata: JSON.stringify(subscription.metadata),
    },
  });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Update subscription status
  const statusMap: Record<string, any> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
  };

  await prisma.billingSubscription.update({
    where: { userId },
    data: {
      status: statusMap[subscription.status] || "ACTIVE",
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.billingSubscription.update({
    where: { userId },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Find subscription by Stripe subscription ID
  const billingSubscription = await prisma.billingSubscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!billingSubscription) return;

  // Create payment record
  await prisma.billingPayment.create({
    data: {
      subscriptionId: billingSubscription.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "SUCCEEDED",
      description: invoice.description || undefined,
      billingEmail: invoice.customer_email || undefined,
      billingName: invoice.customer_name || undefined,
      paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      stripeEventId: invoice.id,
      metadata: JSON.stringify(invoice.metadata),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const billingSubscription = await prisma.billingSubscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!billingSubscription) return;

  // Create failed payment record
  await prisma.billingPayment.create({
    data: {
      subscriptionId: billingSubscription.id,
      stripePaymentIntentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "FAILED",
      description: invoice.description || undefined,
      failedAt: new Date(),
      failureMessage: "Payment failed",
      stripeEventId: invoice.id,
      metadata: JSON.stringify(invoice.metadata),
    },
  });

  // Update subscription status
  await prisma.billingSubscription.update({
    where: { id: billingSubscription.id },
    data: {
      status: "PAST_DUE",
    },
  });
}
