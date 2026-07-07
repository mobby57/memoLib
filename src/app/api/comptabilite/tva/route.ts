/**
 * API Route - TVA
 * GET /api/comptabilite/tva — Liste les déclarations TVA
 * POST /api/comptabilite/tva — Crée/recalcule une déclaration TVA
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { TVAService } from '@/lib/services/comptabilite';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const annee = searchParams.get('annee') ? parseInt(searchParams.get('annee')!) : undefined;

  try {
    const declarations = await TVAService.listerDeclarations(user.tenantId, annee);
    return NextResponse.json({ declarations });
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
    const { periode, regime } = await req.json();

    if (!periode || !regime) {
      return NextResponse.json(
        { error: 'Champs requis : periode (ex: "2026-Q2" ou "2026-06"), regime' },
        { status: 400 }
      );
    }

    const declaration = await TVAService.creerDeclaration(user.tenantId, { periode, regime });
    return NextResponse.json(declaration, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 }
    );
  }
}
