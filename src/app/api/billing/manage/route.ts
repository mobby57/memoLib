/**
 * API Route: POST /api/billing/manage
 * 
 * Redirige vers le Stripe Customer Portal pour gérer l'abonnement.
 * L'avocat peut y : voir ses factures, changer de plan, annuler, mettre à jour sa CB.
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { createCustomerPortalSession } from '@/lib/billing/stripe-client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const tenantId = (session.user as any).tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });
  }

  // Récupérer le stripeCustomerId du tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { stripeCustomerId: true, name: true },
  });

  if (!tenant?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Aucun compte de facturation trouvé. Contactez le support.' },
      { status: 404 }
    );
  }

  try {
    const portalSession = await createCustomerPortalSession({
      customerId: tenant.stripeCustomerId,
      returnUrl: `${process.env.NEXTAUTH_URL}/fr/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'Impossible d\'ouvrir le portail de facturation.' },
      { status: 500 }
    );
  }
}
