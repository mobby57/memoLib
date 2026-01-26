/**
 * API Portail Client Stripe
 * Redirige vers le portail de gestion d'abonnement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createCustomerPortalSession } from '@/lib/billing/stripe-client';
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

    // Recuperer la subscription
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      select: { metadata: true }
    });

    if (!subscription || !subscription.metadata) {
      return NextResponse.json(
        { error: 'Pas d\'abonnement actif' },
        { status: 404 }
      );
    }

    // Extraire le Stripe Customer ID du metadata
    const metadata = typeof subscription.metadata === 'string' 
      ? JSON.parse(subscription.metadata) 
      : subscription.metadata;
    
    const customerId = metadata.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Client Stripe introuvable' },
        { status: 404 }
      );
    }

    // Creer la session portail
    const portalSession = await createCustomerPortalSession({
      customerId,
      returnUrl: `${process.env.NEXTAUTH_URL}/admin/billing`,
    });

    return NextResponse.json({
      success: true,
      portalUrl: portalSession.url,
    });
  } catch (error) {
    console.error('Erreur creation portail:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
