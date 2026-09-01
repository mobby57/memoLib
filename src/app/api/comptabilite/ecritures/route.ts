import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
/**
 * API Route - Écritures comptables
 * GET /api/comptabilite/ecritures — Liste des écritures
 * POST /api/comptabilite/ecritures — Créer une écriture
 */

import { NextRequest, NextResponse } from 'next/server';
import { EcrituresService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { searchParams } = new URL(req.url);

  try {
    const result = await EcrituresService.listerEcritures(user.tenantId, {
      journalCode: searchParams.get('journal') || undefined,
      dateDebut: searchParams.get('dateDebut') ? new Date(searchParams.get('dateDebut')!) : undefined,
      dateFin: searchParams.get('dateFin') ? new Date(searchParams.get('dateFin')!) : undefined,
      statut: (searchParams.get('statut') as any) || undefined,
      compteNumero: searchParams.get('compte') || undefined,
      dossierId: searchParams.get('dossierId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    });

    return NextResponse.json(result);
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

    if (!body.journalCode || !body.date || !body.libelle || !body.lignes?.length) {
      return NextResponse.json(
        { error: 'Champs requis : journalCode, date, libelle, lignes' },
        { status: 400 }
      );
    }

    const ecriture = await EcrituresService.creerEcriture({
      tenantId: user.tenantId,
      journalCode: body.journalCode,
      date: new Date(body.date),
      libelle: body.libelle,
      reference: body.reference,
      factureId: body.factureId,
      dossierId: body.dossierId,
      source: body.source || 'MANUELLE',
      lignes: body.lignes,
    });

    return NextResponse.json(ecriture, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    const status = message.includes('introuvable') || message.includes('déséquilibrée') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}




