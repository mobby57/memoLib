import { auth } from '@/lib/clerk-auth';
/**
import { logger } from '@/lib/logger';
 * API Endpoint - Dashboard des coûts IA
 * GET /api/billing/ai-costs
 * 
 * Permet aux tenants de surveiller leurs dépenses IA
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { 
  getCostDashboard, 
  checkTenantProfitability,
  MONTHLY_COST_LIMITS,
  COST_ALERT_THRESHOLDS
} from '@/lib/billing/cost-guard';

export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const tenantId = (user as { tenantId?: string }).tenantId;
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le dashboard des coûts
    const dashboard = await getCostDashboard(tenantId);
    
    // Vérifier la rentabilité (admin seulement)
    let profitability: Awaited<ReturnType<typeof checkTenantProfitability>> | null = null;
    const userRole = (user as { role?: string }).role;
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      profitability = await checkTenantProfitability(tenantId);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dashboard,
        profitability,
        config: {
          limits: MONTHLY_COST_LIMITS,
          thresholds: COST_ALERT_THRESHOLDS,
        },
      },
    });
  } catch (error) {
    logger.error('Erreur API ai-costs:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}




