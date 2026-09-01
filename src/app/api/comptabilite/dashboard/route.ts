import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Dashboard comptable
 * GET /api/comptabilite/dashboard — KPIs financiers temps réel
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/comptabilite';
import { CARPAService } from '@/lib/services/comptabilite';
import { RapprochementService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const [kpis, soldeCARPA, rapprochement] = await Promise.all([
      ReportingService.dashboard(user.tenantId),
      CARPAService.getSoldeGlobal(user.tenantId),
      RapprochementService.getStats(user.tenantId),
    ]);

    return NextResponse.json({
      ...kpis,
      carpa: { soldeGlobal: soldeCARPA },
      rapprochement,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




