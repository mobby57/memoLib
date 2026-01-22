import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { canTransitionToReadyForHuman } from '@/types/workspace-reasoning';

/**
 * POST /api/lawyer/workspace/[id]/resolve-missing
 * Résoudre un élément manquant
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
    
    const user = session.user as any;
    const userId = user.id;
    const tenantId = user.tenantId;
    const workspaceId = params.id;
    
    // Vérifier isolation tenant
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
      include: {
        missingElements: true,
      },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }
    
    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillé' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { missingElementId, resolution } = body;
    
    if (!missingElementId || !resolution) {
      return NextResponse.json(
        { error: 'missingElementId et resolution requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'élément appartient au workspace
    const missingElement = workspace.missingElements.find(m => m.id === missingElementId);
    if (!missingElement) {
      return NextResponse.json(
        { error: 'Élément manquant non trouvé' },
        { status: 404 }
      );
    }
    
    // Résoudre l'élément
    const updated = await prisma.missingElement.update({
      where: { id: missingElementId },
      data: {
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution,
      },
    });
    
    // Créer une trace de raisonnement
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: `Résolution élément manquant (${missingElement.type})`,
        explanation: resolution,
        createdBy: userId,
      },
    });
    
    // Récupérer TOUS les missing elements mis à jour
    const allMissing = await prisma.missingElement.findMany({
      where: { workspaceId },
    });
    
    // Vérifier si on peut passer à READY_FOR_HUMAN
    const canTransition = canTransitionToReadyForHuman(allMissing);
    
    if (canTransition && workspace.currentState === 'MISSING_IDENTIFIED') {
      // Transition automatique vers READY_FOR_HUMAN
      await prisma.workspaceReasoning.update({
        where: { id: workspaceId },
        data: {
          currentState: 'READY_FOR_HUMAN',
          stateChangedAt: new Date(),
          stateChangedBy: 'SYSTEM',
          uncertaintyLevel: 0.15, // Très faible incertitude
        },
      });
      
      await prisma.reasoningTransition.create({
        data: {
          workspaceId,
          fromState: 'MISSING_IDENTIFIED',
          toState: 'READY_FOR_HUMAN',
          triggeredBy: 'SYSTEM',
          reason: 'Tous les éléments bloquants résolus - transition automatique',
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      missingElement: updated,
      canTransitionToReady: canTransition,
    });
    
  } catch (error) {
    console.error('Erreur résolution élément manquant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
