/**
 * API Route - Rapprochement bancaire
 * GET /api/comptabilite/banque — Stats + suggestions de rapprochement
 * POST /api/comptabilite/banque — Import de mouvements bancaires (CSV)
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { RapprochementService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;

  try {
    const [suggestions, stats] = await Promise.all([
      RapprochementService.suggererRapprochements(user.tenantId),
      RapprochementService.getStats(user.tenantId),
    ]);

    return NextResponse.json({ stats, suggestions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;

  try {
    const body = await req.json();

    if (!body.compteBancaire || !body.csv) {
      return NextResponse.json(
        { error: 'Champs requis : compteBancaire (IBAN), csv (contenu du fichier)' },
        { status: 400 }
      );
    }

    const mouvements = RapprochementService.parseCSV(body.csv);

    if (mouvements.length === 0) {
      return NextResponse.json(
        { error: 'Aucun mouvement trouvé dans le CSV' },
        { status: 400 }
      );
    }

    const result = await RapprochementService.importerMouvements(
      user.tenantId,
      body.compteBancaire,
      mouvements
    );

    return NextResponse.json({
      ...result,
      mouvementsParsed: mouvements.length,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
