/**
 * API Route: GET /api/workspace-reasoning/[id]
 * RÃ©cupÃ¨re un workspace complet avec toutes ses relations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    // Authentification
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const workspaceId = params.id;

    // RÃ©cupÃ©rer le workspace avec toutes les relations
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
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    // VÃ©rifier l'accÃ¨s (isolation tenant)
    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ© - Isolation tenant' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      workspace,
    });
  } catch (error) {
    logger.error('Erreur rÃ©cupÃ©ration workspace', error instanceof Error ? error : undefined, {
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
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const workspaceId = params.id;

    // VÃ©rifier existence et accÃ¨s
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ© - Isolation tenant' }, { status: 403 });
    }

    // Soft delete (Prisma middleware le transforme en update)
    await prisma.workspaceReasoning.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace supprimÃ©',
    });
  } catch (error) {
    logger.error('Erreur suppression workspace', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

