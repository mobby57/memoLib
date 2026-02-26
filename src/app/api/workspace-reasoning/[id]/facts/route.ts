/**
import { logger } from '@/lib/logger';
 * API Route: POST /api/workspace-reasoning/[id]/facts
 * Ajoute un fait au workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const workspaceId = params.id;
    const body = await request.json();
    const { label, value, source, sourceRef } = body;

    if (!label || !value || !source) {
      return NextResponse.json(
        { error: 'label, value et source requis' },
        { status: 400 }
      );
    }

    // Vérifier workspace et accès
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }

    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Accès refusé - Isolation tenant' },
        { status: 403 }
      );
    }

    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillé' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    // Créer le fait
    const fact = await prisma.fact.create({
      data: {
        workspaceId,
        label,
        value,
        source,
        sourceRef,
        confidence: source === 'USER_PROVIDED' ? 0.8 : 1.0,
        extractedBy: userId
      }
    });

    // Trace
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: 'FACT_ADDED',
        explanation: `Fait ajouté: ${label} = ${value}`,
        metadata: JSON.stringify({ factId: fact.id, source }),
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      fact
    }, { status: 201 });

  } catch (error) {
    logger.error('Error adding fact:', { error });
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
