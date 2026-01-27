import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { factureId } = await request.json();

    if (!factureId) {
      return NextResponse.json({ error: 'ID de facture requis' }, { status: 400 });
    }

    // Récupérer la facture depuis la base de données
    const facture = await prisma.facture.findUnique({
      where: { id: factureId },
      include: {
        client: true,
        tenant: true,
      },
    });

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 });
    }

    // Vérifier que le client a accès à cette facture
    if (facture.client?.userId !== session.user.id && session.user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé à cette facture' }, { status: 403 });
    }

    // Vérifier que la facture n'est pas déjà payée
    if (facture.statut === 'payee') {
      return NextResponse.json({ error: 'Cette facture est déjà payée' }, { status: 400 });
    }

    // Créer la session Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      mode: 'payment',
      customer_email: facture.client?.email || session.user.email || undefined,
      client_reference_id: factureId,
      metadata: {
        factureId,
        tenantId: facture.tenantId,
        factureNumero: facture.numero,
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Facture ${facture.numero}`,
              description: facture.description || `Paiement de la facture ${facture.numero}`,
            },
            unit_amount: Math.round(facture.montantTTC * 100), // Stripe attend des centimes
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/client/paiement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/client/paiement/annule?facture_id=${factureId}`,
    });

    // Logger l'événement de paiement initié
    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_INITIATED',
        userId: session.user.id,
        tenantId: facture.tenantId,
        entityType: 'Facture',
        entityId: factureId,
        details: {
          stripeSessionId: checkoutSession.id,
          montant: facture.montantTTC,
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Erreur création session Stripe:', error);

    // Si Stripe n'est pas configuré, retourner une erreur explicite
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: "Configuration Stripe manquante. Contactez l'administrateur." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    );
  }
}
