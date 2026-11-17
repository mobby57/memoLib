import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAbsolute, relative, resolve, sep } from 'path';

const updateSchema = z.object({
  verified: z.boolean().optional(),
  category: z.string().max(80).optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(80)).max(30).optional(),
}).strict();

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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Parametres invalides' }, { status: 400 });
    }
    const { verified, category, description, tags } = parsed.data;

    const updateData: {
      verified?: boolean;
      verifiedAt?: Date | null;
      verifiedBy?: string | null;
      documentType?: string;
      description?: string | null;
      tags?: string;
    } = {};

    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = (session.user as any).id;
      } else {
        updateData.verifiedAt = null;
        updateData.verifiedBy = null;
      }
    }

    if (category !== undefined) updateData.documentType = category;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    const existing = await prisma.workspaceDocument.findFirst({
      where: { id: params.docId, workspaceId: params.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    const document = await prisma.workspaceDocument.update({
      where: { id: existing.id },
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
    const document = await prisma.workspaceDocument.findFirst({
      where: { id: params.docId, workspaceId: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    // Supprimer le fichier physique si existe
    const storageRoot = resolve(process.cwd(), 'private-uploads');
    const physicalPath = resolve(storageRoot, document.storagePath);
    const storageRelativePath = relative(storageRoot, physicalPath);
    if (
      storageRelativePath === '..' ||
      storageRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(storageRelativePath)
    ) {
      return NextResponse.json({ error: 'Chemin de document invalide' }, { status: 400 });
    }
    if (existsSync(physicalPath)) {
      try {
        await unlink(physicalPath);
      } catch (error) {
        logger.error('Impossible de supprimer le fichier prive', error instanceof Error ? error : undefined);
        return NextResponse.json({ error: 'Suppression du fichier impossible' }, { status: 500 });
      }
    }

    // Supprimer de la base
    await prisma.workspaceDocument.delete({
      where: { id: document.id },
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

