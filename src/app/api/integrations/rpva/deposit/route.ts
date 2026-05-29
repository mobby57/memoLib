import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/integrations/rpva/deposit
 * Prepare le depot de conclusions via RPVA (Reseau Prive Virtuel Avocats).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { dossierId, documentId, juridiction, typeActe } = await req.json();

  if (!dossierId || !typeActe) {
    return NextResponse.json({ error: 'dossierId et typeActe requis' }, { status: 400 });
  }

  const typesActes = ['conclusions', 'requete', 'memoire', 'piece', 'bordereau'];
  if (!typesActes.includes(typeActe)) {
    return NextResponse.json({ error: `typeActe invalide. Valeurs: ${typesActes.join(', ')}` }, { status: 400 });
  }

  // RPVA necessite un certificat electronique avocat — simulation
  return NextResponse.json({
    success: true,
    status: 'prepared',
    deposit: {
      id: `rpva-${Date.now()}`,
      dossierId,
      documentId,
      juridiction: juridiction || 'Tribunal administratif',
      typeActe,
      preparedAt: new Date().toISOString(),
    },
    note: 'Depot prepare. Connexion RPVA avec certificat electronique requise pour envoi reel.',
    requirements: ['Certificat electronique avocat (cle USB)', 'Logiciel RPVA installe', 'Document au format PDF/A'],
  });
}
