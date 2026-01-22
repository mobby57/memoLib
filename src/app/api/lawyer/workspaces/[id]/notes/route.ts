import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/lawyer/workspaces/[id]/notes
 * Liste les notes d'un workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Récupérer workspace avec notes
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    // Filtrer notes
    let notes = workspace.notes;

    if (filter === 'pinned') {
      notes = notes.filter(n => n.isPinned);
    } else if (filter === 'private') {
      notes = notes.filter(n => n.isPrivate);
    } else if (filter === 'team') {
      notes = notes.filter(n => !n.isPrivate);
    }

    return NextResponse.json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    console.error('Erreur GET notes:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lawyer/workspaces/[id]/notes
 * Créer une nouvelle note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, isPrivate, isPinned, tags } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Contenu requis' }, { status: 400 });
    }

    const note = await prisma.workspaceNote.create({
      data: {
        workspaceId: params.id,
        title: title || undefined,
        content,
        authorId: (session.user as any).id,
        authorName: session.user.name || 'Utilisateur',
        isPrivate: isPrivate || false,
        isPinned: isPinned || false,
        tags: tags ? JSON.stringify(tags) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Note créée',
      note,
    });
  } catch (error) {
    console.error('Erreur POST note:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
