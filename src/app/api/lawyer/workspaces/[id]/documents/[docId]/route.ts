import { auth } from '@/lib/clerk-auth';
import { authorizeWorkspaceAccess } from '@/lib/auth/workspace-access';
import { RBAC_PERMISSIONS, requireApiPermission } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { z } from 'zod';

const updateDocumentSchema = z
  .object({
    verified: z.boolean().optional(),
    category: z.string().trim().max(100).optional(),
    description: z.string().trim().max(2_000).optional(),
    tags: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  })
  .strict();

/**
 * PATCH /api/lawyer/workspaces/[id]/documents/[docId]
 * Mettre à jour un document (vérification, métadonnées)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOCUMENTS_MANAGE);
    if (!permission.ok) return permission.response;
    const workspaceAccess = await authorizeWorkspaceAccess(params.id, user);
    if (!workspaceAccess.ok) return workspaceAccess.response;

    const parsedBody = updateDocumentSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { verified, category, description, tags } = parsedBody.data;

    const document = await prisma.workspaceDocument.findFirst({
      where: {
        id: params.docId,
        workspaceId: params.id,
        tenantId: workspaceAccess.workspace.tenantId,
      },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    const updateData: {
      verified?: boolean;
      verifiedAt?: Date;
      verifiedBy?: string;
      category?: string;
      description?: string;
      tags?: string;
    } = {};

    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = (user as any).id;
      }
    }

    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);

    const updatedDocument = await prisma.workspaceDocument.update({
      where: { id: document.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Document mis à jour',
      document: updatedDocument,
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
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOCUMENTS_MANAGE);
    if (!permission.ok) return permission.response;
    const workspaceAccess = await authorizeWorkspaceAccess(params.id, user);
    if (!workspaceAccess.ok) return workspaceAccess.response;

    // Récupérer document pour supprimer le fichier physique
    const document = await prisma.workspaceDocument.findFirst({
      where: {
        id: params.docId,
        workspaceId: params.id,
        tenantId: workspaceAccess.workspace.tenantId,
      },
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
