/**
 * API Analytics - Métriques IA et Apprentissage Continu
 * Endpoint: /api/tenant/[tenantId]/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface AnalyticsParams {
  params: { tenantId: string };
}

export async function GET(
  request: NextRequest,
  { params }: AnalyticsParams
) {
  try {
    const { tenantId } = params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculer la date de début selon la période
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Récupérer toutes les actions IA de la période
    const aiActions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculer les métriques globales
    const totalActions = aiActions.length;
    const approvedActions = aiActions.filter(a => 
      a.validationStatus === 'APPROVED' || a.validationStatus === 'AUTO_APPROVED'
    ).length;
    const modifiedActions = aiActions.filter(a => 
      a.validationStatus === 'MODIFIED_APPROVED'
    ).length;
    const rejectedActions = aiActions.filter(a => 
      a.validationStatus === 'REJECTED'
    ).length;

    const globalSuccessRate = totalActions > 0 
      ? (approvedActions + modifiedActions) / totalActions 
      : 0;

    // Analyser les performances par type d'action
    const actionTypeStats = new Map<string, {
      total: number;
      approved: number;
      modified: number;
      rejected: number;
      totalConfidence: number;
    }>();

    aiActions.forEach(action => {
      const type = action.actionType;
      const stats = actionTypeStats.get(type) || {
        total: 0,
        approved: 0,
        modified: 0,
        rejected: 0,
        totalConfidence: 0
      };

      stats.total++;
      stats.totalConfidence += action.confidence;

      switch (action.validationStatus) {
        case 'APPROVED':
        case 'AUTO_APPROVED':
          stats.approved++;
          break;
        case 'MODIFIED_APPROVED':
          stats.modified++;
          break;
        case 'REJECTED':
          stats.rejected++;
          break;
      }

      actionTypeStats.set(type, stats);
    });

    // Calculer les améliorations (simulation basée sur les données actuelles)
    const improvements = Array.from(actionTypeStats.entries()).map(([type, stats]) => {
      const currentSuccessRate = stats.total > 0 
        ? (stats.approved + stats.modified) / stats.total 
        : 0;
      
      // Simulation d'amélioration basée sur le taux de succès
      let improvement = 0;
      let status: 'improving' | 'stable' | 'declining' = 'stable';
      
      if (currentSuccessRate > 0.85) {
        improvement = Math.random() * 0.05; // +0-5%
        status = 'improving';
      } else if (currentSuccessRate < 0.7) {
        improvement = -(Math.random() * 0.1); // -0-10%
        status = 'declining';
      } else {
        improvement = (Math.random() - 0.5) * 0.04; // ±2%
        status = improvement > 0 ? 'improving' : improvement < -0.01 ? 'declining' : 'stable';
      }

      return {
        actionType: type,
        currentSuccessRate,
        improvement,
        status
      };
    });

    // Répartition des actions par type
    const actionsByType = Array.from(actionTypeStats.entries()).map(([type, stats]) => ({
      type,
      count: stats.total,
      avgConfidence: stats.total > 0 ? stats.totalConfidence / stats.total : 0
    }));

    // Tendances de validation (7 derniers jours)
    const validationTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayActions = aiActions.filter(action => {
        const actionDate = new Date(action.createdAt);
        return actionDate >= dayStart && actionDate <= dayEnd;
      });

      validationTrends.push({
        date: dayStart.toISOString(),
        approved: dayActions.filter(a => 
          a.validationStatus === 'APPROVED' || a.validationStatus === 'AUTO_APPROVED'
        ).length,
        rejected: dayActions.filter(a => a.validationStatus === 'REJECTED').length,
        modified: dayActions.filter(a => a.validationStatus === 'MODIFIED_APPROVED').length
      });
    }

    const analyticsData = {
      period: range,
      globalSuccessRate,
      totalActions,
      improvements,
      actionsByType,
      validationTrends,
      generatedAt: now.toISOString()
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Erreur analytics:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul des analytics' },
      { status: 500 }
    );
  }
}