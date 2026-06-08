import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { generateContextualChecklist, type ClientContext } from '@/lib/dossier/contextual-checklist';
import { generateDossierInboxEmail } from '@/lib/dossier/checklist-templates';

/**
 * POST /api/dossiers/[id]/checklist/contextual
 *
 * Génère une checklist personnalisée selon la situation spécifique du client.
 * Remplace la checklist statique par une liste adaptée au contexte.
 *
 * Body: ClientContext (typeDossier, hasChildren, hasMedicalIssue, etc.)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;
  const context: ClientContext = await req.json();

  const dossier = await prisma.dossier.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!dossier) return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });

  // Utiliser le type du dossier si non fourni dans le contexte
  if (!context.typeDossier) context.typeDossier = dossier.typeDossier;

  // Générer la checklist contextuelle
  const template = generateContextualChecklist(context);

  // Supprimer l'ancienne checklist si elle existe
  await prisma.dossierChecklistItem.deleteMany({ where: { dossierId: id } });

  // Créer les items personnalisés
  const items = await Promise.all(
    template.map((item, index) =>
      prisma.dossierChecklistItem.create({
        data: {
          dossierId: id,
          tenantId: user.tenantId,
          label: item.label,
          category: item.category,
          required: item.required,
          notes: item.reason,
          order: index,
        },
      })
    )
  );

  // Générer inbox email si pas déjà fait
  const inboxEmail = dossier.inboxEmail || generateDossierInboxEmail(dossier.numero);

  // Mettre à jour le dossier
  await prisma.dossier.update({
    where: { id },
    data: {
      inboxEmail,
      checklistTotal: items.length,
      checklistReceived: 0,
      checklistComplete: false,
    },
  });

  return NextResponse.json({
    success: true,
    inboxEmail,
    itemsCount: items.length,
    items: items.map(i => ({ id: i.id, label: i.label, category: i.category, required: i.required })),
    context: {
      typeDossier: context.typeDossier,
      hasChildren: context.hasChildren,
      hasMedicalIssue: context.hasMedicalIssue,
      isEmployed: context.isEmployed,
    },
    message: `Checklist personnalisée générée (${items.length} pièces) selon la situation du client`,
  }, { status: 201 });
}
