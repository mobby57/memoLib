import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route: POST /api/billing/manage
 * 
 * Redirige vers le Stripe Customer Portal pour gérer l'abonnement.
 * L'avocat peut y : voir ses factures, changer de plan, annuler, mettre à jour sa CB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCustomerPortalSession } from '@/lib/billing/stripe-client';

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const tenantId = (user as any).tenantId;
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
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fr/settings`,
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




