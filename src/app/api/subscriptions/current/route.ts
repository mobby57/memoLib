import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
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
                            in: ['active', 'trialing', 'past_due']
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

        const subscription = user.subscriptions[0] || null;

        return NextResponse.json({
            subscription: subscription
                ? {
                    id: subscription.id,
                    tier: subscription.tier,
                    status: subscription.status,
                    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
                }
                : null
        });
    } catch (error: any) {
        console.error('Error fetching current subscription:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
