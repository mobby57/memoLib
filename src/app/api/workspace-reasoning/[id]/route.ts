/**
 * API Route: GET /api/workspace-reasoning/[id]
 * Récupère un workspace complet avec toutes ses relations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Récupérer le workspace avec toutes les relations
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: {
          orderBy: { createdAt: 'asc' },
        },
        contexts: {
          orderBy: { createdAt: 'asc' },
        },
        obligations: {
          orderBy: { createdAt: 'asc' },
        },
        missingElements: {
          orderBy: { createdAt: 'asc' },
        },
        risks: {
          orderBy: { riskScore: 'desc' },
        },
        proposedActions: {
          orderBy: { createdAt: 'asc' },
        },
        reasoningTraces: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limiter pour performance
        },
        transitions: {
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    // Vérifier l'accès (isolation tenant)
    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'Accès refusé - Isolation tenant' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    logger.error('Erreur récupération workspace', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/workspace-reasoning/[id]
 * Supprime un workspace (soft delete)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const workspaceId = params.id;

    // Vérifier existence et accès
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'Accès refusé - Isolation tenant' }, { status: 403 });
    }

    // Soft delete (Prisma middleware le transforme en update)
    await prisma.workspaceReasoning.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace supprimé',
    });
  } catch (error) {
    logger.error('Erreur suppression workspace', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
