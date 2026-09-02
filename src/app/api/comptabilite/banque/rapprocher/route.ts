import { auth } from '@/lib/clerk-auth';
/**
 * API Route - Rapprochement bancaire : confirmer
 * POST /api/comptabilite/banque/rapprocher — Confirme un rapprochement
 */

import { NextRequest, NextResponse } from 'next/server';
import { RapprochementService } from '@/lib/services/comptabilite';

export async function POST(req: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  if (!user.tenantId) return NextResponse.json({ error: 'Tenant requis' }, { status: 400 });

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




