// app/api/payments/webhook/route.ts
// POST /api/payments/webhook
// Handle Stripe webhook events

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import {
    isStripeEventDuplicate,
    logStripeWebhookProcessingFailure,
    parseStripeWebhookRequest,
} from '@/lib/stripe/webhook';
import Stripe from 'stripe';

type DbClient = any;

function isStripeEventUniqueViolation(error: any): boolean {
    const message = String(error?.message || '');
    return (
        error?.code === 'P2002' &&
        (message.includes('stripeEventId') || message.includes('stripeWebhookEvent'))
    );
}

export async function POST(request: NextRequest) {
    const parsed = await parseStripeWebhookRequest(request, stripe, STRIPE_WEBHOOK_SECRET);
    if (!parsed.ok) {
        return parsed.response;
    }

    const { event } = parsed;

    const isDuplicate = await isStripeEventDuplicate(event.id);
    if (isDuplicate) {
        return NextResponse.json({ received: true, duplicate: true });
    }

    try {
        await prisma.$transaction(async tx => {
            const db = tx as DbClient;

            await db.stripeWebhookEvent.create({
                data: {
                    stripeEventId: event.id,
                    provider: 'stripe',
                    eventType: event.type,
                    status: 'PROCESSING',
                    payload: JSON.stringify(event),
                },
            });

            switch (event.type) {
                case 'payment_intent.succeeded':
                    await handlePaymentIntentSucceeded(db, event.data.object as Stripe.PaymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    await handlePaymentIntentFailed(db, event.data.object as Stripe.PaymentIntent);
                    break;

                case 'customer.subscription.created':
                    await handleSubscriptionCreated(db, event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.updated':
                    await handleSubscriptionUpdated(db, event.data.object as Stripe.Subscription);
                    break;

                case 'customer.subscription.deleted':
                    await handleSubscriptionDeleted(db, event.data.object as Stripe.Subscription);
                    break;

                case 'invoice.paid':
                    await handleInvoicePaid(db, event.data.object as Stripe.Invoice);
                    break;

                case 'invoice.payment_failed':
                    await handleInvoicePaymentFailed(db, event.data.object as Stripe.Invoice);
                    break;

                default:
                    break;
            }

            await db.stripeWebhookEvent.update({
                where: { stripeEventId: event.id },
                data: {
                    status: 'PROCESSED',
                    processedAt: new Date(),
                },
            });
        });

        return NextResponse.json({ received: true });
    } catch (error: any) {
        if (isStripeEventUniqueViolation(error)) {
            return NextResponse.json({ received: true, duplicate: true });
        }

        logStripeWebhookProcessingFailure(event.type);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentIntentSucceeded(db: DbClient, paymentIntent: Stripe.PaymentIntent) {
    await db.paymentIntent.update({
        where: { stripeIntentId: paymentIntent.id },
        data: {
            status: 'succeeded',
            receiptUrl: (paymentIntent as any).charges?.data?.[0]?.receipt_url,
        },
    });
}

async function handlePaymentIntentFailed(db: DbClient, paymentIntent: Stripe.PaymentIntent) {
    await db.paymentIntent.update({
        where: { stripeIntentId: paymentIntent.id },
        data: {
            status: 'failed',
            lastError: (paymentIntent as any).last_payment_error?.message,
        },
    });
}

async function handleSubscriptionCreated(db: DbClient, subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string;
    const customer = await db.stripeCustomer.findUnique({
        where: { stripeCustomerId: customerId },
    });

    if (!customer) return;

    await db.subscription.create({
        data: {
            userId: customer.userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            productId: subscription.items.data[0].price.product as string,
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
    });
}

async function handleSubscriptionUpdated(db: DbClient, subscription: Stripe.Subscription) {
    await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: subscription.status,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            canceledAt: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000)
                : null,
        },
    });
}

async function handleSubscriptionDeleted(db: DbClient, subscription: Stripe.Subscription) {
    await db.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: 'canceled',
            canceledAt: new Date(),
        },
    });
}

async function handleInvoicePaid(db: DbClient, invoice: Stripe.Invoice) {
    const customerId = invoice.customer as string;
    const customer = await db.stripeCustomer.findUnique({
        where: { stripeCustomerId: customerId },
    });

    if (!customer) return;

    await db.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
            userId: customer.userId,
            stripeCustomerId: customerId,
            stripeInvoiceId: invoice.id,
            amountCents: invoice.amount_due,
            taxCents: (invoice as any).tax || 0,
            totalCents: invoice.total,
            currency: invoice.currency,
            status: 'paid',
            paidDate: new Date((invoice as any).status_transitions.paid_at * 1000),
            pdfUrl: invoice.invoice_pdf,
            hostedInvoiceUrl: invoice.hosted_invoice_url,
        },
        update: {
            status: 'paid',
            paidDate: new Date((invoice as any).status_transitions.paid_at * 1000),
        },
    });
}

async function handleInvoicePaymentFailed(db: DbClient, invoice: Stripe.Invoice) {
    await db.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: { status: 'uncollectible' },
    });
}
