/**
 * API Route: POST /api/workspace-reasoning/[id]/transition
 * Change l'état du workspace avec validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { WorkspaceReasoningService } from '@/lib/workspace-reasoning-service';
import { WorkspaceState } from '@/types/workspace-reasoning';

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
    const { targetState, reason } = body;

    if (!targetState) {
      return NextResponse.json(
        { error: 'targetState requis' },
        { status: 400 }
      );
    }

    // Récupérer le workspace avec toutes les relations
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true
      }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier accès tenant
    const userTenantId = (session.user as any).tenantId;
    if (workspace.tenantId !== userTenantId) {
      return NextResponse.json(
        { error: 'Accès refusé - Isolation tenant' },
        { status: 403 }
      );
    }

    // Vérifier si verrouillé
    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillé - Aucune modification possible' },
        { status: 403 }
      );
    }

    // Valider la transition
    const validation = WorkspaceReasoningService.validateStateTransition(
      workspace.currentState as WorkspaceState,
      targetState as WorkspaceState,
      workspace as any
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Calculer nouvelles métriques
    const metrics = WorkspaceReasoningService.updateWorkspaceMetrics(workspace as any);

    // Mettre à jour le workspace
    const updatedWorkspace = await prisma.workspaceReasoning.update({
      where: { id: workspaceId },
      data: {
        currentState: targetState,
        stateChangedAt: new Date(),
        stateChangedBy: userId,
        uncertaintyLevel: metrics.uncertaintyLevel,
        reasoningQuality: metrics.reasoningQuality,
        updatedAt: new Date()
      },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
        reasoningTraces: true,
        transitions: true
      }
    });

    // Créer l'enregistrement de transition (audit trail)
    await prisma.reasoningTransition.create({
      data: {
        workspaceId,
        fromState: workspace.currentState,
        toState: targetState,
        triggeredBy: userId,
        triggeredAt: new Date(),
        reason: reason || `Transition vers ${targetState}`,
        autoApproved: false,
        stateBefore: JSON.stringify({
          currentState: workspace.currentState,
          uncertaintyLevel: workspace.uncertaintyLevel,
          reasoningQuality: workspace.reasoningQuality
        }),
        stateAfter: JSON.stringify({
          currentState: targetState,
          uncertaintyLevel: metrics.uncertaintyLevel,
          reasoningQuality: metrics.reasoningQuality
        })
      }
    });

    // Créer trace de raisonnement
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: `${workspace.currentState} → ${targetState}`,
        explanation: reason || `Transition d'état validée`,
        metadata: JSON.stringify({
          previousMetrics: {
            uncertainty: workspace.uncertaintyLevel,
            quality: workspace.reasoningQuality
          },
          newMetrics: metrics
        }),
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      workspace: updatedWorkspace,
      metrics
    });

  } catch (error) {
    console.error('Error transitioning workspace:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
