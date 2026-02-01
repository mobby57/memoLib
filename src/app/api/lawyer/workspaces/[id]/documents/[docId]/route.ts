import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

/**
 * PATCH /api/lawyer/workspaces/[id]/documents/[docId]
 * Mettre à jour un document (vérification, métadonnées)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
      message: 'Document mis à jour',
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer document pour supprimer le fichier physique
    const document = await prisma.workspaceDocument.findUnique({
      where: { id: params.docId },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
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
      message: 'Document supprimé',
    });
  } catch (error) {
    logger.error('Erreur DELETE document:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
