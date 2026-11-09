/**
 * API Route: PATCH /api/dossiers/[id]/confidential
 * 
 * Active/dÃ©sactive le mode confidentiel sur un dossier.
 * Quand activÃ© : IA cloud bloquÃ©e, seul Ollama (local) ou regex est utilisÃ©.
 */

import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { setConfidentialMode, checkConfidentialMode } from '@/lib/security/confidential-mode';
import { getSecurePrisma } from '@/lib/prisma';;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const { id: dossierId } = await params;
  const user = session.user as any;
  const tenantId = user.tenantId;

  // VÃ©rifier que le dossier appartient au tenant
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId },
    select: { id: true, numero: true, confidentialMode: true },
  });

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { confidential } = body as { confidential?: boolean };
  if (typeof confidential !== 'boolean') {
    return NextResponse.json({ error: 'Le champ "confidential" (boolean) est requis' }, { status: 400 });
  }

  await setConfidentialMode(dossierId, confidential);

  return NextResponse.json({
    dossierId,
    numero: dossier.numero,
    confidentialMode: confidential,
    message: confidential
      ? 'ðŸ”’ Mode confidentiel activÃ©. L\'IA cloud est bloquÃ©e pour ce dossier.'
      : 'ðŸ”“ Mode confidentiel dÃ©sactivÃ©. L\'IA cloud est autorisÃ©e.',
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = await getSecurePrisma();
  const session = await getServerSessionCompat();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisÃ©' }, { status: 401 });
  }

  const { id: dossierId } = await params;
  const result = await checkConfidentialMode(dossierId);

  return NextResponse.json(result);
}

