import { auth } from '@/lib/clerk-auth';
/**
 * API Route - Compte de résultat
 * GET /api/comptabilite/resultat?dateDebut=2026-01-01&dateFin=2026-12-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  const { searchParams } = new URL(req.url);

  try {
    const result = await ReportingService.compteDeResultat(user.tenantId, {
      dateDebut: searchParams.get('dateDebut')
        ? new Date(searchParams.get('dateDebut')!)
        : new Date(new Date().getFullYear(), 0, 1),
      dateFin: searchParams.get('dateFin')
        ? new Date(searchParams.get('dateFin')!)
        : new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




