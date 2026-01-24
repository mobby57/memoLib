import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * [emoji] API: Liste des soumissions de formulaires
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const formType = searchParams.get('formType');

    const where: any = {};
    if (status) where.status = status;
    if (formType) where.formType = formType;

    const submissions = await prisma.formSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        formType: true,
        submitterEmail: true,
        status: true,
        impactScore: true,
        submittedAt: true,
        data: true,
      },
    });

    // Parser les donnees JSON
    const parsedSubmissions = submissions.map((sub) => ({
      ...sub,
      data: JSON.parse(sub.data),
    }));

    return NextResponse.json(parsedSubmissions);
  } catch (error) {
    console.error('Erreur liste soumissions:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des soumissions' },
      { status: 500 }
    );
  }
}
