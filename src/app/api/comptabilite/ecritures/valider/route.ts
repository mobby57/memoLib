// CLERK-MIGRATION: Remplacement session.user -> user (vérifier)
// CLERK-MIGRATION: Remplacement getServerSession() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Validation d'écritures
 * POST /api/comptabilite/ecritures/valider — Valider un lot d'écritures
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { EcrituresService } from '@/lib/services/comptabilite';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = user as any;

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




