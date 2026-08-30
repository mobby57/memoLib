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

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                subscriptions: {
                    where: {
                        status: {
                            in: ['active', 'trialing']
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const subscription = user.subscriptions[0];

        if (!subscription) {
            return NextResponse.json(
                { error: 'No active subscription found' },
                { status: 404 }
            );
        }

        // Cancel subscription at period end
        const cancelledSubscription = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
                cancel_at_period_end: true
            }
        );

        // Update database
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                cancelAtPeriodEnd: true
            }
        });

        // Create subscription history entry
        await prisma.subscriptionHistory.create({
            data: {
                subscriptionId: subscription.id,
                action: 'CANCELLED',
                fromTier: subscription.tier,
                toTier: 'FREE',
                reason: 'User requested cancellation'
            }
        });

        return NextResponse.json({
            message: 'Subscription will be cancelled at the end of the billing period',
            cancelAt: new Date((cancelledSubscription as any).current_period_end * 1000).toISOString()
        });
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
