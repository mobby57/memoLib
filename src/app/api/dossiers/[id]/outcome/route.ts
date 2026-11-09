import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;

/**
 * PATCH /api/dossiers/[id]/outcome
 * Enregistre le rÃ©sultat d'un dossier (favorable/defavorable/partiel).
 * Alimente les statistiques anonymisÃ©es par tribunal.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as any;
  const { outcome, notes } = await req.json();

  const validOutcomes = ['favorable', 'defavorable', 'partiel', 'desistement', 'irrecevable'];
  if (!outcome || !validOutcomes.includes(outcome)) {
    return NextResponse.json(
      { error: `Outcome invalide. Valeurs acceptÃ©es : ${validOutcomes.join(', ')}` },
      { status: 400 }
    );
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 });
  }

  const updated = await prisma.dossier.update({
    where: { id },
    data: {
      outcome,
      outcomeDate: new Date(),
      outcomeNotes: notes || null,
      statut: 'termine',
    },
  });

  return NextResponse.json({
    success: true,
    dossier: {
      id: updated.id,
      numero: updated.numero,
      outcome: updated.outcome,
      outcomeDate: updated.outcomeDate,
    },
  });
}

