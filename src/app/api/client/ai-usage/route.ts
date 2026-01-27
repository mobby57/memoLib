/**
 * API pour que les clients voient leur propre usage IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 400 });
    }

    // Récupérer les paramètres de période
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Récupérer le plan du tenant pour connaître la limite
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });

    const planName = tenant?.plan?.name || 'starter';
    const budgetLimit = getBudgetLimit(planName);

    // Calculer l'usage du mois
    let usage = { totalCost: 0, totalRequests: 0, totalTokens: 0 };
    let dailyUsage: { date: string; cost: number; requests: number }[] = [];
    let byModel: Record<string, { cost: number; requests: number }> = {};

    try {
      // Agrégat total
      const aggregate = await prisma.aIUsageLog.aggregate({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: {
          costEur: true,
          tokensUsed: true,
        },
        _count: true,
      });

      usage = {
        totalCost: aggregate._sum.costEur || 0,
        totalRequests: aggregate._count || 0,
        totalTokens: aggregate._sum.tokensUsed || 0,
      };

      // Usage par jour
      const dailyData = await prisma.aIUsageLog.groupBy({
        by: ['createdAt'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { costEur: true },
        _count: true,
      });

      // Regrouper par date
      const dailyMap = new Map<string, { cost: number; requests: number }>();
      for (const d of dailyData) {
        const dateStr = d.createdAt.toISOString().split('T')[0];
        const existing = dailyMap.get(dateStr) || { cost: 0, requests: 0 };
        dailyMap.set(dateStr, {
          cost: existing.cost + (d._sum.costEur || 0),
          requests: existing.requests + d._count,
        });
      }
      dailyUsage = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Usage par modèle
      const modelData = await prisma.aIUsageLog.groupBy({
        by: ['model'],
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        _sum: { costEur: true },
        _count: true,
      });

      for (const m of modelData) {
        byModel[m.model] = {
          cost: m._sum.costEur || 0,
          requests: m._count,
        };
      }
    } catch {
      // Table n'existe peut-être pas encore
      logger.debug('Tables AIUsageLog non disponibles', { route: '/api/client/ai-usage' });
    }

    // Calculer les statistiques
    const percentage = budgetLimit > 0 ? (usage.totalCost / budgetLimit) * 100 : 0;
    const remaining = Math.max(0, budgetLimit - usage.totalCost);

    // Projection fin de mois
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(year, month, 0).getDate();
    const projectedCost =
      dayOfMonth > 0 ? (usage.totalCost / dayOfMonth) * daysInMonth : usage.totalCost;

    // Déterminer le statut
    let status: 'normal' | 'warning' | 'critical' | 'exceeded' = 'normal';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 90) status = 'critical';
    else if (percentage >= 70) status = 'warning';

    // Générer des recommandations
    const recommendations: string[] = [];

    if (status === 'exceeded' || status === 'critical') {
      recommendations.push('🚨 Contactez le support pour augmenter votre limite IA');
    }

    if (usage.totalCost > 0 && !byModel['ollama']) {
      recommendations.push('💡 Installez Ollama sur votre serveur pour réduire les coûts à 0€');
    }

    if (projectedCost > budgetLimit) {
      recommendations.push(
        `📊 Projection fin de mois: ${projectedCost.toFixed(2)}€ (dépasse la limite)`
      );
    }

    return NextResponse.json({
      period: {
        month,
        year,
        label: new Date(year, month - 1).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
      },
      budget: {
        limit: budgetLimit,
        used: usage.totalCost,
        remaining,
        percentage: Math.round(percentage * 10) / 10,
        status,
      },
      usage: {
        totalCost: Math.round(usage.totalCost * 100) / 100,
        totalRequests: usage.totalRequests,
        totalTokens: usage.totalTokens,
        avgCostPerRequest:
          usage.totalRequests > 0
            ? Math.round((usage.totalCost / usage.totalRequests) * 10000) / 10000
            : 0,
      },
      projection: {
        endOfMonth: Math.round(projectedCost * 100) / 100,
        willExceed: projectedCost > budgetLimit,
      },
      breakdown: {
        byModel,
        daily: dailyUsage,
      },
      plan: {
        name: tenant?.plan?.displayName || planName,
        aiIncluded: `${budgetLimit}€/mois`,
      },
      recommendations,
    });
  } catch (error) {
    logger.error('Erreur API client ai-usage', error instanceof Error ? error : undefined, {
      route: '/api/client/ai-usage',
    });
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'usage" },
      { status: 500 }
    );
  }
}

function getBudgetLimit(planName: string): number {
  const limits: Record<string, number> = {
    FREE: 0.5,
    SOLO: 5,
    CABINET: 30,
    ENTERPRISE: 100,
    starter: 0.5,
    pro: 10,
    enterprise: 50,
    BASIC: 5,
    PREMIUM: 30,
  };
  return limits[planName] || 5;
}
