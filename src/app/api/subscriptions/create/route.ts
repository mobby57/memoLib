import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-session';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const ALLOWED_PRICE_IDS: Record<string, string> = {
    PRO_MONTHLY:        process.env.STRIPE_PRICE_PRO_MONTHLY        || '',
    PRO_YEARLY:         process.env.STRIPE_PRICE_PRO_YEARLY         || '',
    ENTERPRISE_MONTHLY: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || '',
    ENTERPRISE_YEARLY:  process.env.STRIPE_PRICE_ENTERPRISE_YEARLY  || '',
};
const ALLOWED_TIERS = ['PRO', 'ENTERPRISE'] as const;
type AllowedTier = (typeof ALLOWED_TIERS)[number];

type ExpandedSubscription = Stripe.Subscription & {
    latest_invoice?: Stripe.Invoice & {
        payment_intent?: Stripe.PaymentIntent;
    };
};

type SubscriptionPeriods = {
    current_period_start: number;
    current_period_end: number;
};

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const priceKey: string = body?.priceKey;
        const tier: string = body?.tier;

        if (!priceKey || !tier) {
            return NextResponse.json(
                { error: 'Missing required fields: priceKey, tier' },
                { status: 400 }
            );
        }

        if (!(ALLOWED_TIERS as readonly string[]).includes(tier)) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        const priceId = ALLOWED_PRICE_IDS[priceKey];
        if (!priceId) {
            return NextResponse.json({ error: 'Invalid price key' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { stripeCustomer: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let stripeCustomerId = user.stripeCustomer?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: { userId: user.id }
            });

            await prisma.stripeCustomer.create({
                data: {
                    userId: user.id,
                    stripeCustomerId: customer.id,
                    email: user.email
                }
            });

            stripeCustomerId = customer.id;
        }

        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: { userId: user.id, tier }
        }) as ExpandedSubscription;

        const subscriptionPeriods = subscription as unknown as SubscriptionPeriods;

        await prisma.subscription.create({
            data: {
                userId: user.id,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId,
                tier: tier as AllowedTier,
                status: subscription.status,
                currentPeriodStart: new Date(subscriptionPeriods.current_period_start * 1000),
                currentPeriodEnd: new Date(subscriptionPeriods.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
        });
    } catch (error: unknown) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: 'Une erreur est survenue lors de la création de l\'abonnement.' },
            { status: 500 }
        );
    }
}
