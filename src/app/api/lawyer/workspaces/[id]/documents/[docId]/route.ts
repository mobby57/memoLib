import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

/**
 * PATCH /api/lawyer/workspaces/[id]/documents/[docId]
 * Mettre Ã  jour un document (vÃ©rification, mÃ©tadonnÃ©es)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const body = await request.json();
    const { verified, category, description, tags } = body;

    const updateData: any = {};

    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = (session.user as any).id;
      }
    }

    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    const document = await prisma.workspaceDocument.update({
      where: { id: params.docId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Document mis Ã  jour',
      document,
    });
  } catch (error) {
    logger.error('Erreur PATCH document:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/lawyer/workspaces/[id]/documents/[docId]
 * Supprimer un document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    // RÃ©cupÃ©rer document pour supprimer le fichier physique
    const document = await prisma.workspaceDocument.findUnique({
      where: { id: params.docId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    // Supprimer le fichier physique si existe
    const physicalPath = join(process.cwd(), 'public', document.storagePath);
    if (existsSync(physicalPath)) {
      try {
        await unlink(physicalPath);
      } catch (error) {
        logger.warn('Fichier physique introuvable:', { physicalPath });
      }
    }

    // Supprimer de la base
    await prisma.workspaceDocument.delete({
      where: { id: params.docId },
    });

    return NextResponse.json({
      success: true,
      message: 'Document supprimÃ©',
    });
  } catch (error) {
    logger.error('Erreur DELETE document:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

