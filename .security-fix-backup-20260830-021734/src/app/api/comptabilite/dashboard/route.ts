/**
 * API Route - Dashboard comptable
 * GET /api/comptabilite/dashboard — KPIs financiers temps réel
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ReportingService } from '@/lib/services/comptabilite';
import { CARPAService } from '@/lib/services/comptabilite';
import { RapprochementService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;

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
