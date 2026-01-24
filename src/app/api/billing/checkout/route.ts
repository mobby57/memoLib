/**
 * API Checkout Stripe
 * Cree une session de paiement pour s'abonner a un plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createCheckoutSession } from '@/lib/billing/stripe-client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Pas de tenant' }, { status: 400 });
    }

    const { planName, billingCycle = 'monthly', trialDays = 0 } = await request.json();

    // Recuperer le plan
    const plan = await prisma.plan.findUnique({
      where: { name: planName, isActive: true }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan introuvable' }, { status: 404 });
    }

    // Recuperer le tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, billingEmail: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant introuvable' }, { status: 404 });
    }

    // Creer la session Stripe Checkout
    // NOTE: Vous devez creer les prix dans Stripe Dashboard et stocker les IDs
    const priceId = billingCycle === 'yearly' 
      ? `price_${planName.toLowerCase()}_yearly` // a remplacer par vrai ID Stripe
      : `price_${planName.toLowerCase()}_monthly`; // a remplacer par vrai ID Stripe

    const checkoutSession = await createCheckoutSession({
      priceId,
      customerEmail: tenant.billingEmail || user.email,
      tenantId,
      successUrl: `${process.env.NEXTAUTH_URL}/admin/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/admin/billing?canceled=true`,
      trialDays,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error('Erreur creation checkout:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
