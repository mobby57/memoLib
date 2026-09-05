import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { user } = await auth();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
                stripeCustomer: {
                    include: {
                        invoices: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 50
                        }
                    }
                }
            }
        });

        if (!dbUser?.stripeCustomer) {
            return NextResponse.json({ invoices: [] });
        }

        return NextResponse.json({
            invoices: dbUser.stripeCustomer.invoices.map((inv: any) => ({
                id: inv.id,
                amount: inv.amountDue,
                currency: inv.currency,
                status: inv.status,
                createdAt: inv.createdAt.toISOString(),
                pdfUrl: inv.invoicePdfUrl
            }))
        });
    } catch (error: any) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}




