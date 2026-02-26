import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { priceId, tier } = await req.json();

        if (!priceId || !tier) {
            return NextResponse.json(
                { error: 'Missing required fields: priceId, tier' },
                { status: 400 }
            );
        }

        // Get or create Stripe customer
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
                metadata: {
                    userId: user.id
                }
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

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                userId: user.id,
                tier
            }
        });

        // Save subscription to database
        await prisma.subscription.create({
            data: {
                userId: user.id,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId,
                tier,
                status: subscription.status,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
            }
        });

        return NextResponse.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret
        });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
