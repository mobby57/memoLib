import { auth } from '@/lib/clerk-auth';
import { authorizeWorkspaceAccess } from '@/lib/auth/workspace-access';
import { RBAC_PERMISSIONS, requireApiPermission } from '@/lib/auth/rbac';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createNoteSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    content: z.string().trim().min(1).max(20_000),
    isPrivate: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  })
  .strict();

/**
 * GET /api/lawyer/workspaces/[id]/notes
 * Liste les notes d'un workspace
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const permission = requireApiPermission({ user }, RBAC_PERMISSIONS.DOSSIERS_READ);
    if (!permission.ok) return permission.response;
    const workspaceAccess = await authorizeWorkspaceAccess(params.id, user);
    if (!workspaceAccess.ok) return workspaceAccess.response;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Récupérer workspace avec notes
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        notes: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
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
    logger.error('Erreur GET notes', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/notes',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/lawyer/workspaces/[id]/notes
 * Créer une nouvelle note
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const parsedBody = createNoteSchema.safeParse(await request.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { title, content, isPrivate, isPinned, tags } = parsedBody.data;

    const note = await prisma.workspaceNote.create({
      data: {
        workspaceId: params.id,
        title: title || undefined,
        content,
        authorId: user.id,
        authorName: user.name || 'Utilisateur',
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
    logger.error('Erreur POST note', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/notes',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
