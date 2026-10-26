/**
 * API Route - Rapprochement bancaire : confirmer
 * POST /api/comptabilite/banque/rapprocher — Confirme un rapprochement
 */

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { RapprochementService } from '@/lib/services/comptabilite';

export async function POST(req: NextRequest) {
  const session = await getServerSessionCompat();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;

  try {
    const { mouvementId, ecritureId } = await req.json();

    if (!mouvementId || !ecritureId) {
      return NextResponse.json(
        { error: 'Champs requis : mouvementId, ecritureId' },
        { status: 400 }
      );
    }

    const result = await RapprochementService.confirmerRapprochement(
      user.tenantId,
      mouvementId,
      ecritureId
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
