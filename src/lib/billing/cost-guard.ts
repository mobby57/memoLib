/**
 * 🛡️ Cost Guard - Protection Anti-Faillite
 * 
 * Ce module surveille et limite les coûts IA par tenant
 * pour garantir la rentabilité de chaque client.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================
// CONFIGURATION DES COÛTS
// ============================================

export const AI_COSTS = {
  // Cloudflare Workers AI (en euros)
  cloudflare: {
    costPer1000Tokens: 0.01, // ~$0.011 converti
    costPerEmbedding: 0.0001,
  },
  // Ollama local = GRATUIT
  ollama: {
    costPer1000Tokens: 0, // 🎉 Gratuit!
    costPerEmbedding: 0,
  },
};

// Limites de coûts mensuels par plan (en euros)
// Calculé pour garantir une marge > 80%
export const MONTHLY_COST_LIMITS: Record<string, number> = {
  // Plans stratégiques
  SOLO: 5,          // 5€/mois max pour 49€ de revenu
  CABINET: 30,      // 30€/mois max pour 349€ de revenu
  ENTERPRISE: 100,  // 100€/mois max pour 1200€+ de revenu
  
  // Plans existants dans votre DB
  BASIC: 5,         // 5€/mois max pour 49€
  PREMIUM: 15,      // 15€/mois max pour 149€
  starter: 0.50,    // Plan gratuit
  pro: 10,          // 10€/mois max pour 99€
  enterprise: 30,   // 30€/mois max pour 299€
  
  // Fallback
  FREE: 0.50,       // 0.50€/mois max pour les trials
  DEFAULT: 5,       // Fallback si plan inconnu
};

// Alertes de coûts (% de la limite)
export const COST_ALERT_THRESHOLDS = {
  WARNING: 70,    // Alerte à 70%
  CRITICAL: 90,   // Critique à 90%
  BLOCKED: 100,   // Blocage à 100%
};

interface CostCheckResult {
  allowed: boolean;
  currentCost: number;
  limit: number;
  percentage: number;
  alertLevel: 'normal' | 'warning' | 'critical' | 'blocked';
  suggestOllama: boolean;
}

interface UsageRecord {
  tenantId: string;
  provider: 'ollama' | 'cloudflare';
  tokensUsed: number;
  costEur: number;
  operation: string;
  timestamp: Date;
}

/**
 * Vérifier si un tenant peut utiliser l'IA payante
 */
export async function checkAICostBudget(tenantId: string): Promise<CostCheckResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant || !tenant.plan) {
    return {
      allowed: false,
      currentCost: 0,
      limit: 0,
      percentage: 100,
      alertLevel: 'blocked',
      suggestOllama: true,
    };
  }

  const planName = tenant.plan.name;
  const monthlyLimit = MONTHLY_COST_LIMITS[planName] || MONTHLY_COST_LIMITS.DEFAULT || 5;

  // Calculer les coûts du mois en cours
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCost = await getMonthlyAICost(tenantId, startOfMonth);
  const percentage = monthlyLimit > 0 ? (currentCost / monthlyLimit) * 100 : 100;

  let alertLevel: CostCheckResult['alertLevel'] = 'normal';
  if (percentage >= COST_ALERT_THRESHOLDS.BLOCKED) {
    alertLevel = 'blocked';
  } else if (percentage >= COST_ALERT_THRESHOLDS.CRITICAL) {
    alertLevel = 'critical';
  } else if (percentage >= COST_ALERT_THRESHOLDS.WARNING) {
    alertLevel = 'warning';
  }

  return {
    allowed: percentage < COST_ALERT_THRESHOLDS.BLOCKED,
    currentCost,
    limit: monthlyLimit,
    percentage,
    alertLevel,
    suggestOllama: percentage >= COST_ALERT_THRESHOLDS.WARNING,
  };
}

/**
 * Calculer le coût IA mensuel d'un tenant
 */
async function getMonthlyAICost(tenantId: string, since: Date): Promise<number> {
  try {
    // Utiliser Prisma avec le modèle AIUsageLog
    const result = await prisma.aIUsageLog.aggregate({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
      _sum: {
        costEur: true,
      },
    });
    return result._sum.costEur || 0;
  } catch {
    // Table n'existe pas encore, retourner 0
    return 0;
  }
}

/**
 * Enregistrer une utilisation IA et son coût
 */
export async function recordAIUsage(usage: UsageRecord): Promise<void> {
  try {
    await prisma.aIUsageLog.create({
      data: {
        tenantId: usage.tenantId,
        provider: usage.provider,
        tokensUsed: usage.tokensUsed,
        costEur: usage.costEur,
        operation: usage.operation,
        createdAt: usage.timestamp,
      },
    });

    // Log si coût significatif
    if (usage.costEur > 0.01) {
      logger.info('AI usage recorded', {
        tenantId: usage.tenantId,
        provider: usage.provider,
        tokens: usage.tokensUsed,
        cost: `${usage.costEur.toFixed(4)}€`,
      });
    }
  } catch (error) {
    // Ignorer si table n'existe pas encore
    logger.warn('Could not record AI usage (table may not exist)', { error });
  }
}

/**
 * Calculer le coût estimé d'une opération IA
 */
export function estimateCost(
  provider: 'ollama' | 'cloudflare',
  estimatedTokens: number
): number {
  const costs = AI_COSTS[provider];
  return (estimatedTokens / 1000) * costs.costPer1000Tokens;
}

/**
 * Choisir le meilleur provider selon le budget restant
 */
export async function selectOptimalProvider(
  tenantId: string,
  estimatedTokens: number = 1000
): Promise<'ollama' | 'cloudflare'> {
  const budget = await checkAICostBudget(tenantId);
  
  // Si budget serré ou dépassé, forcer Ollama
  if (budget.suggestOllama || !budget.allowed) {
    return 'ollama';
  }

  // Calculer si on peut se permettre Cloudflare
  const cloudflareEstimate = estimateCost('cloudflare', estimatedTokens);
  const remainingBudget = budget.limit - budget.currentCost;

  if (cloudflareEstimate > remainingBudget * 0.1) {
    // L'opération coûterait plus de 10% du budget restant
    return 'ollama';
  }

  // On peut utiliser Cloudflare
  return 'cloudflare';
}

/**
 * Dashboard des coûts pour un tenant
 */
export async function getCostDashboard(tenantId: string) {
  const budget = await checkAICostBudget(tenantId);
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Stats par provider
  let providerStats = { ollama: 0, cloudflare: 0 };
  try {
    const stats = await prisma.aIUsageLog.groupBy({
      by: ['provider'],
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        costEur: true,
      },
    });
    stats.forEach(s => {
      providerStats[s.provider as keyof typeof providerStats] = s._sum.costEur || 0;
    });
  } catch {
    // Table n'existe pas
  }

  return {
    currentMonth: {
      cost: budget.currentCost,
      limit: budget.limit,
      percentage: budget.percentage,
      status: budget.alertLevel,
    },
    byProvider: providerStats,
    recommendations: generateCostRecommendations(budget, providerStats),
    projectedEndOfMonth: projectEndOfMonthCost(budget.currentCost),
  };
}

/**
 * Générer des recommandations pour réduire les coûts
 */
function generateCostRecommendations(
  budget: CostCheckResult,
  providerStats: { ollama: number; cloudflare: number }
): string[] {
  const recommendations: string[] = [];

  if (budget.alertLevel === 'blocked') {
    recommendations.push('⚠️ Budget IA épuisé! Passez au plan supérieur ou attendez le mois prochain.');
  }

  if (providerStats.cloudflare > providerStats.ollama) {
    recommendations.push('💡 Installez Ollama localement pour réduire les coûts de 90%+');
  }

  if (budget.percentage >= 50) {
    recommendations.push('📊 Activez le mode "Ollama prioritaire" pour préserver votre budget');
  }

  if (budget.percentage < 30) {
    recommendations.push('✅ Votre utilisation IA est économique. Continuez ainsi!');
  }

  return recommendations;
}

/**
 * Projeter le coût de fin de mois
 */
function projectEndOfMonthCost(currentCost: number): number {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = daysInMonth - dayOfMonth;
  
  const dailyAverage = currentCost / dayOfMonth;
  return currentCost + (dailyAverage * remainingDays);
}

/**
 * Vérifier la rentabilité d'un tenant
 */
export async function checkTenantProfitability(tenantId: string): Promise<{
  profitable: boolean;
  revenue: number;
  aiCosts: number;
  margin: number;
  marginPercentage: number;
}> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { 
      plan: true,
      subscription: true,
    },
  });

  if (!tenant || !tenant.plan) {
    return { profitable: false, revenue: 0, aiCosts: 0, margin: 0, marginPercentage: 0 };
  }

  const monthlyRevenue = tenant.plan.priceMonthly;
  const aiCosts = await getMonthlyAICost(tenantId, new Date(new Date().setDate(1)));
  const margin = monthlyRevenue - aiCosts;
  const marginPercentage = monthlyRevenue > 0 ? (margin / monthlyRevenue) * 100 : 0;

  return {
    profitable: margin > 0,
    revenue: monthlyRevenue,
    aiCosts,
    margin,
    marginPercentage,
  };
}
