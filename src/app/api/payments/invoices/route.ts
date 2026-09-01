import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const { user } = await auth();
    const session = user ? { user } : null;
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
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

        if (!user?.stripeCustomer) {
            return NextResponse.json({ invoices: [] });
        }

        return NextResponse.json({
            invoices: user.stripeCustomer.invoices.map((inv: any) => ({
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




