import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Plan comptable
 * GET /api/comptabilite/plan-comptable — Liste des comptes
 * POST /api/comptabilite/plan-comptable — Créer un compte
 * POST /api/comptabilite/plan-comptable/init — Initialiser le plan comptable avocat
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlanComptableService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  try {
    const comptes = await PlanComptableService.getPlanComptable(user.tenantId, {
      classe: searchParams.get('classe') ? parseInt(searchParams.get('classe')!) : undefined,
      type: (searchParams.get('type') as any) || undefined,
      actifOnly: searchParams.get('inactifs') !== 'true',
    });

    return NextResponse.json({ comptes });
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

    // Action spéciale : initialiser le plan comptable
    if (body.action === 'init') {
      const count = await PlanComptableService.initialiserPlanComptable(user.tenantId);
      return NextResponse.json({ success: true, comptesCreated: count });
    }

    // Création d'un compte
    if (!body.numero || !body.libelle || !body.classe || !body.type) {
      return NextResponse.json(
        { error: 'Champs requis : numero, libelle, classe, type' },
        { status: 400 }
      );
    }

    const compte = await PlanComptableService.creerCompte(user.tenantId, {
      numero: body.numero,
      libelle: body.libelle,
      classe: body.classe,
      type: body.type,
      parentId: body.parentId,
    });

    return NextResponse.json(compte, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}




