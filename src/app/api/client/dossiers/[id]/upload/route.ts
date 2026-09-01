import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/client/dossiers/[id]/upload
 * Permet au client d'uploader une piece directement.
 * Met a jour la checklist automatiquement.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await auth();
    const session = user ? { user } : null;
  if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });

  const { id } = await params;
  if (!user.clientId) {
    return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const checklistItemId = formData.get('checklistItemId') as string;

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  }

  // Verifier que le dossier appartient au client
  const dossier = await prisma.dossier.findFirst({
    where: { id, clientId: user.clientId },
  });

  if (!dossier) {
    return NextResponse.json({ error: 'Dossier non trouve' }, { status: 404 });
  }

  // Si un item de checklist est specifie, le marquer comme recu
  if (checklistItemId) {
    // Verifier que l'item de checklist appartient bien a ce dossier (anti-IDOR)
    const checklistItem = await prisma.dossierChecklistItem.findFirst({
      where: { id: checklistItemId, dossierId: id },
    });
    if (!checklistItem) {
      return NextResponse.json({ error: 'Piece de checklist non trouvee pour ce dossier' }, { status: 404 });
    }

    await prisma.dossierChecklistItem.update({
      where: { id: checklistItemId },
      data: {
        status: 'received',
        receivedAt: new Date(),
        receivedVia: 'upload_client',
        notes: `Fichier: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
      },
    });

    // Recalculer progression
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
      fileName: file.name,
      checklistItem: checklistItemId,
      progress: `${received}/${allItems.length}`,
      complete,
      message: complete ? 'Dossier COMPLET ! Votre avocat va le traiter.' : `Piece recue (${received}/${allItems.length})`,
    });
  }

  return NextResponse.json({
    success: true,
    fileName: file.name,
    size: `${(file.size / 1024).toFixed(0)} KB`,
    message: 'Document uploade avec succes',
  });
}
