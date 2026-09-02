import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { user } = await auth();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { stripeCustomer: true }
        });

        if (!dbUser?.stripeCustomer) {
            return NextResponse.json({ paymentMethods: [] });
        }

        // Get payment methods from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
            customer: dbUser.stripeCustomer.stripeCustomerId,
            type: 'card'
        });

        return NextResponse.json({
            paymentMethods: paymentMethods.data.map((pm) => ({
                id: pm.id,
                brand: pm.card?.brand || 'unknown',
                last4: pm.card?.last4 || '0000',
                expMonth: pm.card?.exp_month || 0,
                expYear: pm.card?.exp_year || 0
            }))
        });
    } catch (error: any) {
        console.error('Error fetching payment methods:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { user } = await auth();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { paymentMethodId } = await req.json();

        if (!paymentMethodId) {
            return NextResponse.json(
                { error: 'Missing paymentMethodId' },
                { status: 400 }
            );
        }

        // Detach payment method from customer
        await stripe.paymentMethods.detach(paymentMethodId);

        return NextResponse.json({ message: 'Payment method removed successfully' });
    } catch (error: any) {
        console.error('Error removing payment method:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}




