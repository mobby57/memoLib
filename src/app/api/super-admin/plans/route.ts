import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        maxDossiers: data.maxDossiers,
        maxClients: data.maxClients,
        maxStorageGb: data.maxStorageGb,
        maxUsers: data.maxUsers,
        aiAutonomyLevel: data.aiAutonomyLevel,
        humanValidation: data.humanValidation ?? true,
        advancedAnalytics: data.advancedAnalytics ?? false,
        externalAiAccess: data.externalAiAccess ?? false,
        prioritySupport: data.prioritySupport ?? false,
        customBranding: data.customBranding ?? false,
        apiAccess: data.apiAccess ?? false,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
