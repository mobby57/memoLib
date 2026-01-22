import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 404 });
    }

    // Récupérer la subscription du tenant
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
    console.error('Erreur récupération subscription:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
