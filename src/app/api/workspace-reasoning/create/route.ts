/**
 * API Route: POST /api/workspace-reasoning/create
 * Cree un nouveau workspace reasoning
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sourceType,
      sourceId,
      sourceRaw,
      sourceMetadata,
      procedureType,
      clientId,
      dossierId,
      emailId
    } = body;

    // Validation
    if (!sourceType || !sourceRaw) {
      return NextResponse.json(
        { error: 'sourceType et sourceRaw requis' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    const tenantId = (session.user as any).tenantId;

    // Creer le workspace
    const workspace = await prisma.workspaceReasoning.create({
      data: {
        tenantId,
        currentState: 'RECEIVED',
        stateChangedAt: new Date(),
        stateChangedBy: userId,
        
        sourceType,
        sourceId,
        sourceRaw,
        sourceMetadata,
        
        procedureType,
        ownerUserId: userId,
        clientId,
        dossierId,
        emailId,
        
        uncertaintyLevel: 1.0, // Maximum au depart
        reasoningQuality: 0.0, // Minimum au depart
        confidenceScore: 0.0,
        
        locked: false,
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

    // Creer trace de creation
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'WORKSPACE_CREATED',
        explanation: `Workspace cree a partir de ${sourceType}`,
        metadata: JSON.stringify({ sourceId, procedureType }),
        createdBy: userId
      }
    });

    return NextResponse.json({
      success: true,
      workspace
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
