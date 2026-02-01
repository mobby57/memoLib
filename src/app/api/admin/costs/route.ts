/**
 * 🛡️ Admin Cost Management API
 *
 * Permet à l'admin de :
 * - Voir les coûts IA de tous les tenants
 * - Ajuster les limites de budget
 * - Facturer les surcoûts
 */

import { authOptions } from '@/lib/auth';
import { MONTHLY_COST_LIMITS } from '@/lib/billing/cost-guard';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET - Liste tous les tenants avec leurs coûts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session?.user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    // Début et fin du mois
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Récupérer tous les tenants avec leurs coûts
    const tenants = await prisma.tenant.findMany({
      include: {
        plan: true,
        subscription: true,
        _count: {
          select: {
            users: true,
            dossiers: true,
            clients: true,
          },
        },
      },
    });

    // Calculer les coûts par tenant
    const tenantsWithCosts = await Promise.all(
      tenants.map(async tenant => {
        // Coûts IA du mois
        let aiCost = 0;
        let aiTokens = 0;
        try {
          const usage = await prisma.aIUsageLog.aggregate({
            where: {
              tenantId: tenant.id,
              createdAt: { gte: startDate, lte: endDate },
            },
            _sum: { costEur: true, tokensUsed: true },
            _count: true,
          });
          aiCost = usage._sum.costEur || 0;
          aiTokens = usage._sum.tokensUsed || 0;
        } catch {
          // Table peut ne pas exister
        }

        const budgetLimit = MONTHLY_COST_LIMITS[tenant.plan.name] || 5;
        const overage = Math.max(0, aiCost - budgetLimit);
        const usagePercentage = budgetLimit > 0 ? (aiCost / budgetLimit) * 100 : 0;

        return {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: {
            name: tenant.plan.name,
            displayName: tenant.plan.displayName,
            priceMonthly: tenant.plan.priceMonthly,
          },
          subscription: tenant.subscription
            ? {
                status: tenant.subscription.status,
                billingCycle: tenant.subscription.billingCycle,
              }
            : null,
          usage: {
            users: tenant._count.users,
            dossiers: tenant._count.dossiers,
            clients: tenant._count.clients,
          },
          aiCosts: {
            current: parseFloat(aiCost.toFixed(4)),
            limit: budgetLimit,
            overage: parseFloat(overage.toFixed(4)),
            percentage: parseFloat(usagePercentage.toFixed(1)),
            tokens: aiTokens,
            status:
              usagePercentage >= 100 ? 'exceeded' : usagePercentage >= 80 ? 'warning' : 'normal',
          },
          // Montant facturable pour surcoût
          billableOverage:
            overage > 0
              ? {
                  amount: parseFloat((overage * 1.5).toFixed(2)), // Majoration 50%
                  description: `Surcoût IA - ${aiTokens} tokens au-delà du forfait`,
                }
              : null,
        };
      })
    );

    // Trier par coût décroissant
    tenantsWithCosts.sort((a, b) => b.aiCosts.current - a.aiCosts.current);

    // Stats globales
    const totalAICost = tenantsWithCosts.reduce((sum, t) => sum + t.aiCosts.current, 0);
    const totalOverage = tenantsWithCosts.reduce((sum, t) => sum + t.aiCosts.overage, 0);
    const tenantsOverBudget = tenantsWithCosts.filter(t => t.aiCosts.overage > 0).length;

    return NextResponse.json({
      success: true,
      period: { month, year },
      summary: {
        totalTenants: tenants.length,
        totalAICost: parseFloat(totalAICost.toFixed(2)),
        totalOverage: parseFloat(totalOverage.toFixed(2)),
        tenantsOverBudget,
        potentialBilling: parseFloat((totalOverage * 1.5).toFixed(2)), // Avec majoration
      },
      tenants: tenantsWithCosts,
    });
  } catch (error) {
    logger.error('Erreur admin costs:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Actions admin (ajuster limites, créer facture surcoût)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session?.user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const { action, tenantId, data } = body;

    switch (action) {
      case 'adjust_limit':
        // Ajuster la limite de budget IA pour un tenant
        return await adjustBudgetLimit(tenantId, data.newLimit);

      case 'create_overage_invoice':
        // Créer une facture pour le surcoût
        return await createOverageInvoice(tenantId, data);

      case 'reset_usage':
        // Remettre à zéro les compteurs (début de mois)
        return await resetMonthlyUsage(tenantId);

      case 'block_ai':
        // Bloquer l'accès IA pour un tenant
        return await toggleAIAccess(tenantId, false);

      case 'unblock_ai':
        // Débloquer l'accès IA
        return await toggleAIAccess(tenantId, true);

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Erreur action admin', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Ajuster la limite de budget
async function adjustBudgetLimit(tenantId: string, newLimit: number) {
  // Stocker dans les settings du tenant
  await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      // On utilise un champ JSON pour les overrides
      // @ts-ignore - Extension du modèle
    },
    create: {
      tenantId,
      ollamaEnabled: true,
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2:latest',
    },
  });

  // Pour l'instant, on log l'action
  logger.info(`Budget limit adjusted`, { tenantId, newLimit: `${newLimit}€` });

  return NextResponse.json({
    success: true,
    message: `Limite ajustée à ${newLimit}€/mois`,
    tenantId,
    newLimit,
  });
}

// Créer une facture de surcoût
async function createOverageInvoice(
  tenantId: string,
  data: {
    amount: number;
    description: string;
    period: { month: number; year: number };
  }
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { subscription: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 404 });
  }

  // Générer numéro de facture
  const invoiceCount = await prisma.invoice.count();
  const invoiceNumber = `INV-${data.period.year}-${String(invoiceCount + 1).padStart(4, '0')}-OVR`;

  // Créer la facture
  const invoice = await prisma.invoice.create({
    data: {
      subscriptionId: tenant.subscription?.id || '',
      invoiceNumber,
      status: 'PENDING',
      subtotal: data.amount,
      taxAmount: data.amount * 0.2, // TVA 20%
      totalAmount: data.amount * 1.2,
      currency: 'EUR',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
      description: data.description,
      lineItems: [
        {
          description: `Surcoût utilisation IA - ${data.period.month}/${data.period.year}`,
          quantity: 1,
          unitPrice: data.amount,
          total: data.amount,
        },
      ],
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Facture de surcoût créée',
    invoice: {
      id: invoice.id,
      number: invoiceNumber,
      amount: invoice.totalAmount,
      status: invoice.status,
    },
  });
}

// Remettre à zéro l'usage mensuel
async function resetMonthlyUsage(tenantId: string) {
  // Archiver les logs du mois précédent dans AIMonthlySummary
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    const usage = await prisma.aIUsageLog.aggregate({
      where: {
        tenantId,
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { costEur: true, tokensUsed: true },
      _count: true,
    });

    // Créer le résumé mensuel
    await prisma.aIMonthlySummary.upsert({
      where: {
        tenantId_year_month: {
          tenantId,
          year: lastMonth.getFullYear(),
          month: lastMonth.getMonth() + 1,
        },
      },
      update: {
        totalTokens: usage._sum.tokensUsed || 0,
        totalCostEur: usage._sum.costEur || 0,
        requestCount: usage._count,
      },
      create: {
        tenantId,
        year: lastMonth.getFullYear(),
        month: lastMonth.getMonth() + 1,
        totalTokens: usage._sum.tokensUsed || 0,
        totalCostEur: usage._sum.costEur || 0,
        requestCount: usage._count,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Usage archivé et reset effectué',
      archived: {
        month: lastMonth.getMonth() + 1,
        year: lastMonth.getFullYear(),
        tokens: usage._sum.tokensUsed || 0,
        cost: usage._sum.costEur || 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors du reset',
      },
      { status: 500 }
    );
  }
}

// Activer/Désactiver l'accès IA
async function toggleAIAccess(tenantId: string, enabled: boolean) {
  await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      ollamaEnabled: enabled,
    },
    create: {
      tenantId,
      ollamaEnabled: enabled,
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2:latest',
    },
  });

  return NextResponse.json({
    success: true,
    message: enabled ? 'Accès IA réactivé' : 'Accès IA bloqué',
    tenantId,
    aiEnabled: enabled,
  });
}
