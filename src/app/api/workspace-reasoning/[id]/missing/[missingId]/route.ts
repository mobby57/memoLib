/**
import { logger } from '@/lib/logger';
 * API Route: POST /api/workspace-reasoning/[id]/missing/[missingId]
 * RÃ©sout un Ã©lÃ©ment manquant
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurePrisma } from '@/lib/prisma';;
import { logger } from '@/lib/logger';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; missingId: string } }
) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifiÃ©' },
        { status: 401 }
      );
    }

    const { id: workspaceId, missingId } = params;
    const body = await request.json();
    const { resolution } = body;

    if (!resolution) {
      return NextResponse.json(
        { error: 'resolution requise' },
        { status: 400 }
      );
    }

    // VÃ©rifier workspace
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvÃ©' },
        { status: 404 }
      );
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'AccÃ¨s refusÃ© - Isolation tenant' },
        { status: 403 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillÃ©' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    // Marquer comme rÃ©solu
    const missing = await prisma.missingElement.update({
      where: { id: missingId },
      data: {
        resolved: true,
        resolution,
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Trace
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: 'MISSING_RESOLVED',
        explanation: `Ã‰lÃ©ment manquant rÃ©solu: ${missing.description}`,
        metadata: JSON.stringify({
          missingId,
          resolution,
          wasBlocking: missing.blocking
        }),
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      missing
    });

  } catch (error) {
    logger.error('Error resolving missing element:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

