import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * GET /api/v1/factures/:factureId/payment-intent
 * Get or create Stripe payment intent
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { factureId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facture = await prisma.facture.findUnique({
      where: { id: params.factureId },
      include: { client: true },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
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
    const signature = req.headers.get('stripe-signature') || '';
    const body = await req.text();

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Handle payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update paiement status
      const paiement = await prisma.paiement.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (paiement) {
        await prisma.paiement.update({
          where: { id: paiement.id },
          data: {
            status: 'SUCCEEDED',
          },
        });

        // Update facture
        const facture = await prisma.facture.findUnique({
          where: { id: paiement.invoiceId },
        });

        if (facture) {
          await prisma.facture.update({
            where: { id: facture.id },
            data: {
              statut: 'PAID',
              datePaiement: new Date(),
            },
          });

          // Send notification
          await prisma.notification.create({
            data: {
              userId: paiement.clientId,
              type: 'payment_confirmed',
              title: 'Paiement confirmé',
              message: `Votre paiement de ${paiement.amount}€ a été confirmé.`,
            },
          });
        }
      }
    }

    // Handle payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const paiement = await prisma.paiement.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (paiement) {
        await prisma.paiement.update({
          where: { id: paiement.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[POST /api/v1/webhooks/stripe]', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
