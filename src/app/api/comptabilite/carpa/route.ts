import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - CARPA (fonds clients)
 * GET /api/comptabilite/carpa — Résumé des fonds CARPA
 * POST /api/comptabilite/carpa — Enregistrer un mouvement
 */

import { NextRequest, NextResponse } from 'next/server';
import { CARPAService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dossierId = searchParams.get('dossierId');

  try {
    if (dossierId) {
      const [historique, solde] = await Promise.all([
        CARPAService.getHistoriqueDossier(user.tenantId, dossierId),
        CARPAService.getSoldeDossier(user.tenantId, dossierId),
      ]);
      return NextResponse.json({ dossierId, solde, mouvements: historique });
    }

    const [resume, soldeGlobal, alertes] = await Promise.all([
      CARPAService.getResumeParClient(user.tenantId),
      CARPAService.getSoldeGlobal(user.tenantId),
      CARPAService.getAlertesProvisionsDormantes(user.tenantId),
    ]);

    return NextResponse.json({ soldeGlobal, resume, alertes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.dossierId || !body.clientId || !body.type || !body.montant || !body.libelle) {
      return NextResponse.json(
        { error: 'Champs requis : dossierId, clientId, type, montant, libelle' },
        { status: 400 }
      );
    }

    const mouvement = await CARPAService.enregistrerMouvement({
      tenantId: user.tenantId,
      dossierId: body.dossierId,
      clientId: body.clientId,
      type: body.type,
      montant: body.montant,
      libelle: body.libelle,
      reference: body.reference,
    });

    return NextResponse.json(mouvement, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('insuffisants') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}




