import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    // Recuperer tous les plans actifs
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        priceMonthly: true,
        priceYearly: true,
        maxWorkspaces: true,
        maxDossiers: true,
        maxClients: true,
        maxStorageGb: true,
        maxUsers: true,
        aiAutonomyLevel: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      success: true,
      plans,
      count: plans.length 
    });
  } catch (error) {
    console.error('Erreur recuperation plans:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
