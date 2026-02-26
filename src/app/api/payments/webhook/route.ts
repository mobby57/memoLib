// app/api/payments/webhook/route.ts
// POST /api/payments/webhook
// Handle Stripe webhook events

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature' },
            { status: 400 }
        );
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        );
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook handler error:', error);
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        );
    }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    try {
        await (prisma as any).paymentIntent.update({
            where: { stripeIntentId: paymentIntent.id },
            data: {
                status: 'succeeded',
                receiptUrl: (paymentIntent as any).charges?.data?.[0]?.receipt_url,
            },
        });
    } catch (err) {
        console.error('Error updating payment intent:', err);
    }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
        await (prisma as any).paymentIntent.update({
            where: { stripeIntentId: paymentIntent.id },
            data: {
                status: 'failed',
                lastError: (paymentIntent as any).last_payment_error?.message,
            },
        });
    } catch (err) {
        console.error('Error updating failed payment intent:', err);
    }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    try {
        const customerId = subscription.customer as string;
        const customer = await (prisma as any).stripeCustomer.findUnique({
            where: { stripeCustomerId: customerId },
        });

        if (!customer) return;

        await (prisma as any).subscription.create({
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
    } catch (err) {
        console.error('Error creating subscription:', err);
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
        await (prisma as any).subscription.update({
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
    } catch (err) {
        console.error('Error updating subscription:', err);
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    try {
        await (prisma as any).subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: {
                status: 'canceled',
                canceledAt: new Date(),
            },
        });
    } catch (err) {
        console.error('Error deleting subscription:', err);
    }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    try {
        const customerId = invoice.customer as string;
        const customer = await (prisma as any).stripeCustomer.findUnique({
            where: { stripeCustomerId: customerId },
        });

        if (!customer) return;

        await (prisma as any).invoice.upsert({
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
    } catch (err) {
        console.error('Error handling paid invoice:', err);
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    await prisma.invoice.update({
        where: { stripeInvoiceId: invoice.id },
        data: { status: 'uncollectible' },
    });
}
