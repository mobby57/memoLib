import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { MissingElement, canTransitionToReadyForHuman } from '@/types/workspace-reasoning';

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
    
    // Verifier isolation tenant
    const workspace = await prisma.workspaceReasoning.findFirst({
      where: { id: workspaceId, tenantId },
      include: {
        missingElements: true,
      },
    });
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouve' },
        { status: 404 }
      );
    }
    
    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouille' },
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
    
    // Verifier que l'element appartient au workspace
    const missingElement = workspace.missingElements.find(m => m.id === missingElementId);
    if (!missingElement) {
      return NextResponse.json(
        { error: 'Element manquant non trouve' },
        { status: 404 }
      );
    }
    
    // Resoudre l'element
    const updated = await prisma.missingElement.update({
      where: { id: missingElementId },
      data: {
        resolved: true,
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution,
      },
    });
    
    // Creer une trace de raisonnement
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: `Resolution element manquant (${missingElement.type})`,
        explanation: resolution,
        createdBy: userId,
      },
    });
    
    // Recuperer TOUS les missing elements mis a jour
    const allMissing = await prisma.missingElement.findMany({
      where: { workspaceId },
    });
    
    // Verifier si on peut passer a READY_FOR_HUMAN
    const canTransition = canTransitionToReadyForHuman(allMissing as unknown as MissingElement[]);
    
    if (canTransition && workspace.status === 'MISSING_IDENTIFIED') {
      // Transition automatique vers READY_FOR_HUMAN
      await prisma.workspaceReasoning.update({
        where: { id: workspaceId },
        data: {
          status: 'READY_FOR_HUMAN',
          updatedAt: new Date(),
        },
      });
      
      await prisma.reasoningTransition.create({
        data: {
          workspaceId,
          fromStatus: 'MISSING_IDENTIFIED',
          toStatus: 'READY_FOR_HUMAN',
          triggeredBy: 'SYSTEM',
          reason: 'Tous les elements bloquants resolus - transition automatique',
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      missingElement: updated,
      canTransitionToReady: canTransition,
    });
    
  } catch (error) {
    console.error('Erreur resolution element manquant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
