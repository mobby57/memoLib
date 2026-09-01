import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeDossier, type DossierInput } from '@/lib/ai/copilot/copilot-ceseda';
import { canAccessDossier } from '@/lib/auth/dossier-access';

/**
 * GET /api/ai/copilot/[dossierId]
 * Copilote CESEDA — Analyse complète d'un dossier
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ dossierId: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { dossierId } = await params;
  if (!user.tenantId) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    groups: user.groups,
    dossierId,
    action: 'read',
  });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, tenantId: user.tenantId },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      checklistItems: { select: { label: true, status: true, required: true } },
      legalDeadlines: { select: { label: true, dueDate: true, status: true } },
      emails: { select: { subject: true, bodyText: true, from: true, receivedDate: true }, orderBy: { receivedDate: 'desc' }, take: 10 },
      documents: { select: { name: true, type: true } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });

  const input: DossierInput = {
    id: dossier.id,
    typeDossier: dossier.typeDossier,
    description: dossier.description || undefined,
    notes: dossier.notes || undefined,
    statut: dossier.statut,
    dateCreation: dossier.dateCreation.toISOString(),
    dateEcheance: dossier.dateEcheance?.toISOString(),
    client: dossier.client || { firstName: undefined, lastName: undefined, email: undefined },
    checklistItems: dossier.checklistItems,
    legalDeadlines: dossier.legalDeadlines.map(d => ({ ...d, dueDate: d.dueDate.toISOString() })),
    emails: dossier.emails.map(e => ({ subject: e.subject || '', body: e.bodyText || '', from: e.from || '', receivedDate: e.receivedDate.toISOString() })),
    documents: dossier.documents.map(d => ({ name: d.name || '', type: d.type || '' })),
  };

  const analysis = analyzeDossier(input);

  return NextResponse.json(analysis);
}
