import { auth } from '@/lib/clerk-auth';
/**
 * API Route - Grand Livre
 * GET /api/comptabilite/grand-livre?compte=706100&dateDebut=2026-01-01&dateFin=2026-12-31
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportingService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

  const { searchParams } = new URL(req.url);

  const compteNumero = searchParams.get('compte');
  const dateDebut = searchParams.get('dateDebut');
  const dateFin = searchParams.get('dateFin');

  if (!compteNumero) {
    return NextResponse.json({ error: 'Paramètre "compte" requis' }, { status: 400 });
  }

  try {
    const result = await ReportingService.grandLivre(user.tenantId, {
      compteNumero,
      dateDebut: dateDebut ? new Date(dateDebut) : new Date(new Date().getFullYear(), 0, 1),
      dateFin: dateFin ? new Date(dateFin) : new Date(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




