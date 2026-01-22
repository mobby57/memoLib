/**
 * API Route: POST /api/workspace-reasoning/[id]/missing/[missingId]
 * Résout un élément manquant
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; missingId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
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

    // Vérifier workspace
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

    // Marquer comme résolu
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
        explanation: `Élément manquant résolu: ${missing.description}`,
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
    console.error('Error resolving missing element:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
