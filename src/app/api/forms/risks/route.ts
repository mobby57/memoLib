import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
/**
 * ️ API: Liste des risques identifies
 */

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const priority = searchParams.get('priority');

    const where: any = {
      status: 'active',
    };

    if (priority) {
      const priorities = priority.split(',');
      where.priorityLevel = { in: priorities };
    }

    const risks = await prisma.riskAssessment.findMany({
      where,
      orderBy: { riskScore: 'desc' },
      select: {
        id: true,
        category: true,
        description: true,
        probability: true,
        severity: true,
        riskScore: true,
        priorityLevel: true,
        mitigationPlan: true,
        status: true,
        submitterEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json(risks);
  } catch (error) {
    logger.error('Erreur liste risques:', { error });
    return NextResponse.json(
      { error: 'Erreur lors du chargement des risques' },
      { status: 500 }
    );
  }
}


