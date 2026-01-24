import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 *  API: Liste des taches d'approbation
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const approvals = await prisma.approvalTask.findMany({
      where: {
        status,
        isActive: true,
      },
      orderBy: { dueDate: 'asc' },
      include: {
        submission: {
          select: {
            formType: true,
            submitterEmail: true,
            impactScore: true,
          },
        },
      },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error('Erreur liste approbations:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des approbations' },
      { status: 500 }
    );
  }
}
