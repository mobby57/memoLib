import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getChecklistForType, generateDossierInboxEmail } from '@/lib/dossier/checklist-templates';
import { canAccessDossier } from '@/lib/auth/dossier-access';

/**
 * GET /api/dossiers/[id]/checklist
 * Retourne la checklist du dossier avec statut de chaque piece
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!user.tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  const access = await canAccessDossier({ userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups, dossierId: id, action: 'read' });
  if (!access.allowed) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId: user.tenantId },
    select: {
      id: true, numero: true, typeDossier: true, inboxEmail: true,
      checklistComplete: true, checklistTotal: true, checklistReceived: true,
      checklistItems: { orderBy: { order: 'asc' } },
    },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  return NextResponse.json({
    dossierId: dossier.id,
    numero: dossier.numero,
    inboxEmail: dossier.inboxEmail,
    complete: dossier.checklistComplete,
    progress: { total: dossier.checklistTotal, received: dossier.checklistReceived },
    items: dossier.checklistItems,
  });
}

/**
 * POST /api/dossiers/[id]/checklist
 * Initialise la checklist depuis le template (appele a la creation du dossier)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!user.tenantId) return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
  const access = await canAccessDossier({ userId: user.id, tenantId: user.tenantId, role: user.role, groups: user.groups, dossierId: id, action: 'write' });
  if (!access.allowed) return NextResponse.json({ error: 'Acces refuse au dossier' }, { status: 403 });

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  // Generate inbox email
  const inboxEmail = generateDossierInboxEmail(dossier.numero);

  // Get checklist template
  const template = getChecklistForType(dossier.typeDossier);

  // Create checklist items
  const items = await Promise.all(
    template.map((item, index) =>
      prisma.dossierChecklistItem.create({
        data: {
          dossierId: id,
          tenantId: user.tenantId,
          label: item.label,
          category: item.category,
          required: item.required,
          order: index,
        },
      })
    )
  );

  // Update dossier
  await prisma.dossier.update({
    where: { id },
    data: {
      inboxEmail,
      checklistTotal: template.length,
      checklistReceived: 0,
      checklistComplete: false,
    },
  });

  return NextResponse.json({
    success: true,
    inboxEmail,
    items: items.length,
    message: `Checklist initialisee (${items.length} pieces) — email: ${inboxEmail}`,
  }, { status: 201 });
}

/**
 * PATCH /api/dossiers/[id]/checklist
 * Met a jour le statut d'un item (piece recue/validee)
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  const { itemId, status, notes } = await req.json();

  if (!itemId || !['missing', 'received', 'validated', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'itemId et status requis (missing/received/validated/rejected)' }, { status: 400 });
  }

  const item = await prisma.dossierChecklistItem.findFirst({
    where: { id: itemId, dossierId: id, tenantId: user.tenantId },
  });

  if (!item) return NextResponse.json({ error: 'Item non trouve' }, { status: 404 });

  await prisma.dossierChecklistItem.update({
    where: { id: itemId },
    data: {
      status,
      receivedAt: status === 'received' ? new Date() : item.receivedAt,
      notes: notes || item.notes,
    },
  });

  // Recalculate progress
  const allItems = await prisma.dossierChecklistItem.findMany({ where: { dossierId: id } });
  const received = allItems.filter(i => i.status === 'received' || i.status === 'validated').length;
  const requiredItems = allItems.filter(i => i.required);
  const requiredReceived = requiredItems.filter(i => i.status === 'received' || i.status === 'validated').length;
  const complete = requiredReceived === requiredItems.length;

  await prisma.dossier.update({
    where: { id },
    data: { checklistReceived: received, checklistComplete: complete },
  });

  return NextResponse.json({
    success: true,
    progress: { total: allItems.length, received, complete },
    message: complete ? 'DOSSIER COMPLET — Action requise' : `${received}/${allItems.length} pieces recues`,
  });
}
