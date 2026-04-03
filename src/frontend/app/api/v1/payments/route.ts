import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { POST as canonicalWebhookPost } from '@/app/api/payments/webhook/route';
import { requireApiPermission, RBAC_PERMISSIONS } from '@/lib/auth/rbac';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/config';
import { getServerSession } from '@/lib/auth/server-session';
import { NextRequest, NextResponse } from 'next/server';

const hasStripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/v1/factures/:factureId/payment-intent
 * Get or create Stripe payment intent
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { factureId: string } }
) {
  try {
    if (!hasStripeSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = requireApiPermission(session, RBAC_PERMISSIONS.PAYMENTS_CREATE_INTENT);
    if (!guard.ok) {
      return guard.response;
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tenantId: true },
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const facture = await prisma.facture.findUnique({
      where: { id: params.factureId },
      include: { client: true },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (facture.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create Stripe payment intent
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(facture.montantTTC * 100), // in cents
      currency: 'eur',
      metadata: {
        factureId: facture.id,
        clientEmail: facture.client.email,
      },
    });

    // Save to DB
    const paiement = await prisma.paiement.create({
      data: {
        invoiceId: facture.id,
        clientId: facture.clientId,
        amount: facture.montantTTC,
        method: 'CARD',
        status: 'PENDING',
        stripePaymentIntentId: intent.id,
      },
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paiementId: paiement.id,
      amount: facture.montantTTC,
    });
  } catch (error) {
    console.error('[GET /api/v1/factures/:factureId/payment-intent]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/webhooks/stripe
 * Stripe webhook handler
 */
export async function POST(req: NextRequest) {
  try {
    return canonicalWebhookPost(req);
  } catch (error) {
    console.error('[POST /api/v1/webhooks/stripe] delegation failed');
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
