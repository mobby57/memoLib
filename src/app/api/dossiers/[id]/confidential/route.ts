/**
 * API Route: PATCH /api/dossiers/[id]/confidential
 * 
 * Active/désactive le mode confidentiel sur un dossier.
 * Quand activé : IA cloud bloquée, seul Ollama (local) ou regex est utilisé.
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { setConfidentialMode, checkConfidentialMode } from '@/lib/security/confidential-mode';
import { prisma } from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id: dossierId } = await params;
  const user = session.user as any;
  const tenantId = user.tenantId;

  if (!tenantId) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Activer/désactiver le mode confidentiel est une action sensible : reservee au manage
  const access = await canAccessDossier({ userId: user.id, tenantId, role: user.role, groups: user.groups, dossierId, action: 'manage' });
  if (!access.allowed) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  // Vérifier que le dossier appartient au tenant
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
      ? '🔒 Mode confidentiel activé. L\'IA cloud est bloquée pour ce dossier.'
      : '🔓 Mode confidentiel désactivé. L\'IA cloud est autorisée.',
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id: dossierId } = await params;
  const user = session.user as any;
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const access = await canAccessDossier({ userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups, dossierId, action: 'read' });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier introuvable' }, { status: 404 });

  const result = await checkConfidentialMode(dossierId);

  return NextResponse.json(result);
}
