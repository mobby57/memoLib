import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canAccessDossier } from '@/lib/auth/dossier-access';

/**
 * GET /api/dossiers/[id]/timeline
 * Retourne la timeline complete d'un dossier (evenements chronologiques)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  const tenantId = user.tenantId as string | undefined;
  if (!tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });

  const access = await canAccessDossier({
    userId: user.id,
    tenantId,
    role: user.role,
    groups: user.groups,
    dossierId: id,
    action: 'read',
  });
  if (!access.allowed) {
    return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId },
    include: {
      emails: { orderBy: { createdAt: 'asc' }, select: { id: true, subject: true, from: true, createdAt: true } },
      documents: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, createdAt: true } },
      legalDeadlines: { orderBy: { dueDate: 'asc' }, select: { id: true, label: true, dueDate: true, status: true } },
      checklistItems: { where: { status: { not: 'missing' } }, select: { id: true, label: true, receivedAt: true, status: true } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  // Construire la timeline
  const events: any[] = [];

  // Creation
  events.push({ type: 'creation', date: dossier.createdAt, label: `Dossier ${dossier.numero} cree`, icon: 'folder-plus' });

  // Emails
  for (const email of dossier.emails) {
    events.push({ type: 'email', date: email.createdAt, label: `Email: ${email.subject}`, detail: `De: ${email.from}`, icon: 'mail' });
  }

  // Documents
  for (const doc of dossier.documents) {
    events.push({ type: 'document', date: doc.createdAt, label: `Document: ${doc.name}`, icon: 'file' });
  }

  // Pieces recues
  for (const item of dossier.checklistItems) {
    if (item.receivedAt) {
      events.push({ type: 'piece', date: item.receivedAt, label: `Piece recue: ${item.label}`, icon: 'check-circle' });
    }
  }

  // Deadlines
  for (const dl of dossier.legalDeadlines) {
    events.push({ type: 'deadline', date: dl.dueDate, label: dl.label, status: dl.status, icon: 'clock' });
  }

  // Outcome
  if (dossier.outcomeDate) {
    events.push({ type: 'outcome', date: dossier.outcomeDate, label: `Decision: ${dossier.outcome}`, icon: 'gavel' });
  }

  // Trier par date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({
    dossierId: id,
    numero: dossier.numero,
    events,
    total: events.length,
  });
}
