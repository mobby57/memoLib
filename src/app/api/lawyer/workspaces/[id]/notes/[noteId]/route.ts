import { auth } from '@/lib/clerk-auth';
import { authorizeWorkspaceAccess } from '@/lib/auth/workspace-access';
import { RBAC_PERMISSIONS, requireApiPermission } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(300).nullable().optional(),
    content: z.string().trim().min(1).max(20_000).optional(),
    isPrivate: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(100)).max(20).nullable().optional(),
  })
  .strict();

/**
 * PATCH /api/lawyer/workspaces/[id]/notes/[noteId]
 * Mettre à jour une note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
    if (!permission.ok) return permission.response;
    const workspaceAccess = await authorizeWorkspaceAccess(params.id, user);
    if (!workspaceAccess.ok) return workspaceAccess.response;

    const parsedBody = updateNoteSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { title, content, isPrivate, isPinned, tags } = parsedBody.data;

    const note = await prisma.workspaceNote.findFirst({
      where: { id: params.noteId, workspaceId: params.id },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note non trouvée' }, { status: 404 });
    }

    const updateData: {
      title?: string | null;
      content?: string;
      isPrivate?: boolean;
      isPinned?: boolean;
      tags?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;

    const updatedNote = await prisma.workspaceNote.update({
      where: { id: note.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Note mise à jour',
      note: updatedNote,
    });
  } catch (error) {
    logger.error('Erreur PATCH note', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/notes/[noteId]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/lawyer/workspaces/[id]/notes/[noteId]
 * Supprimer une note
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOSSIERS_MANAGE);
    if (!permission.ok) return permission.response;
    const workspaceAccess = await authorizeWorkspaceAccess(params.id, user);
    if (!workspaceAccess.ok) return workspaceAccess.response;

    const note = await prisma.workspaceNote.findFirst({
      where: { id: params.noteId, workspaceId: params.id },
    });
    if (!note) {
      return NextResponse.json({ error: 'Note non trouvée' }, { status: 404 });
    }

    await prisma.workspaceNote.delete({
      where: { id: note.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Note supprimée',
    });
  } catch (error) {
    logger.error('Erreur DELETE note', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/notes/[noteId]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
