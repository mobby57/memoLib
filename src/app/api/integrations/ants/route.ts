import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/integrations/ants/status
 * Verifie le statut d'une demande de titre sur ANTS/ANEF.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'reference requis' }, { status: 400 });

  return NextResponse.json({
    reference,
    status: 'en_cours_instruction',
    statusLabel: 'Dossier en cours d\'instruction',
    lastUpdate: new Date().toISOString(),
    note: 'Simulation. Integration reelle via API ANEF.',
  });
}
