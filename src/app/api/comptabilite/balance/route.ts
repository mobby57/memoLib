import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Balance générale
 * GET /api/comptabilite/balance?dateDebut=2026-01-01&dateFin=2026-12-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  try {
    const result = await ReportingService.balance(user.tenantId, {
      dateDebut: searchParams.get('dateDebut')
        ? new Date(searchParams.get('dateDebut')!)
        : new Date(new Date().getFullYear(), 0, 1),
      dateFin: searchParams.get('dateFin')
        ? new Date(searchParams.get('dateFin')!)
        : new Date(),
      classeMin: searchParams.get('classeMin') ? parseInt(searchParams.get('classeMin')!) : undefined,
      classeMax: searchParams.get('classeMax') ? parseInt(searchParams.get('classeMax')!) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




