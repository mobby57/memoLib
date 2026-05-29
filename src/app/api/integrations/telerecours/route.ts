import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/integrations/telerecours/status
 * Verifie le statut d'une procedure sur Telerecours (TA/CAA).
 * 
 * POST /api/integrations/telerecours/deposit
 * Prepare un depot sur Telerecours.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'reference requis' }, { status: 400 });

  // Simulation statut Telerecours
  return NextResponse.json({
    reference,
    status: 'instruction',
    juridiction: 'Tribunal administratif',
    events: [
      { date: '2026-03-15', action: 'Requete enregistree', reference: `${reference}/REQ` },
      { date: '2026-03-20', action: 'Communication au defendeur', delai: '2 mois' },
      { date: '2026-04-10', action: 'Memoire en defense recu' },
    ],
    nextStep: 'Cloture instruction ou audience',
    note: 'Donnees simulees. Integration reelle necessite acces Telerecours.',
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId, typeActe, juridiction, documentId } = await req.json();

  return NextResponse.json({
    success: true,
    status: 'prepared',
    deposit: {
      id: `tr-${Date.now()}`,
      dossierId,
      typeActe: typeActe || 'requete',
      juridiction: juridiction || 'TA',
      preparedAt: new Date().toISOString(),
    },
    note: 'Depot prepare pour Telerecours. Envoi reel via portail telerecours.fr.',
  });
}
