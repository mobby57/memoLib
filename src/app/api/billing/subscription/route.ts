import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 404 });
    }

    // Recuperer la subscription du tenant
    const subscription = await prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: {
          select: {
            name: true,
            displayName: true,
            priceMonthly: true,
            priceYearly: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ 
        success: true,
        subscription: null,
        message: 'Aucun abonnement actif'
      });
    }

    return NextResponse.json({ 
      success: true,
      subscription 
    });
  } catch (error) {
    logger.error('Erreur recuperation subscription:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}




