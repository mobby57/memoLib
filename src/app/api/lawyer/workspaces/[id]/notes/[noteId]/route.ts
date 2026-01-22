import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/lawyer/workspaces/[id]/notes/[noteId]
 * Mettre à jour une note
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPrivate, isPinned, tags } = body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title || null;
    if (content !== undefined) {
      if (content.trim() === '') {
        return NextResponse.json({ error: 'Contenu requis' }, { status: 400 });
      }
      updateData.content = content;
    }
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (tags !== undefined) updateData.tags = tags ? JSON.stringify(tags) : null;

    const note = await prisma.workspaceNote.update({
      where: { id: params.noteId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Note mise à jour',
      note,
    });
  } catch (error) {
    console.error('Erreur PATCH note:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    await prisma.workspaceNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({
      success: true,
      message: 'Note supprimée',
    });
  } catch (error) {
    console.error('Erreur DELETE note:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
