import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

/**
 * [emoji] API: Statistiques du systeme de formulaires
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Statistiques globales
    const [
      totalSubmissions,
      pendingApprovals,
      criticalRisks,
      strategicDecisions,
      approvedSubmissions,
    ] = await Promise.all([
      prisma.formSubmission.count(),
      prisma.approvalTask.count({ where: { status: 'pending' } }),
      prisma.riskAssessment.count({ where: { priorityLevel: 'critical' } }),
      prisma.strategicDecision.count({ where: { status: 'pending-approval' } }),
      prisma.formSubmission.count({ where: { status: 'approved' } }),
    ]);

    // Calculer le taux d'approbation
    const approvalRate = totalSubmissions > 0 
      ? Math.round((approvedSubmissions / totalSubmissions) * 100)
      : 0;

    // Calculer le score d'impact moyen
    const avgImpactResult = await prisma.formSubmission.aggregate({
      _avg: {
        impactScore: true,
      },
      where: {
        impactScore: { not: null },
      },
    });

    const averageImpactScore = avgImpactResult._avg.impactScore || 0;

    return NextResponse.json({
      totalSubmissions,
      pendingApprovals,
      criticalRisks,
      strategicDecisions,
      approvalRate,
      averageImpactScore,
    });
  } catch (error) {
    console.error('Erreur statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques' },
      { status: 500 }
    );
  }
}
