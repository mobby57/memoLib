import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Validation d'écritures
 * POST /api/comptabilite/ecritures/valider — Valider un lot d'écritures
 */

import { NextRequest, NextResponse } from 'next/server';
import { EcrituresService } from '@/lib/services/comptabilite';

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const { ecritureIds } = await req.json();

    if (!ecritureIds?.length) {
      return NextResponse.json({ error: 'ecritureIds requis (tableau)' }, { status: 400 });
    }

    const result = await EcrituresService.validerEcritures(
      user.tenantId,
      ecritureIds,
      user.id
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




