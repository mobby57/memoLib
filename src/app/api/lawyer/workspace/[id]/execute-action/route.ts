import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/lawyer/workspace/[id]/execute-action
 * Exécuter une action proposée
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
    const { actionId, result } = body;
    
    if (!actionId) {
      return NextResponse.json(
        { error: 'actionId requis' },
        { status: 400 }
      );
    }
    
    // Vérifier que l'action appartient au workspace
    const action = await prisma.proposedAction.findFirst({
      where: {
        id: actionId,
        workspaceId,
      },
    });
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action non trouvee' },
        { status: 404 }
      );
    }
    
    if (action.executed) {
      return NextResponse.json(
        { error: 'Action deja executee' },
        { status: 400 }
      );
    }
    
    // Marquer comme executee
    const updated = await prisma.proposedAction.update({
      where: { id: actionId },
      data: {
        executed: true,
        executedBy: userId,
        executedAt: new Date(),
        result: result || 'Executee avec succes',
      },
    });
    
    // Creer une trace
    await prisma.reasoningTrace.create({
      data: {
        workspaceId,
        step: `Execution action (${action.type})`,
        explanation: `Action "${action.content}" executee par ${userId}. Resultat: ${result || 'Succes'}`,
        createdBy: userId,
      },
    });
    
    return NextResponse.json({
      success: true,
      action: updated,
    });
    
  } catch (error) {
    console.error('Erreur exécution action:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
