/**
 * API ENDPOINT: AI EXTRACTION
 *
 * POST /api/workspace-reasoning/[id]/extract
 *
 * Extrait automatiquement Facts, Contexts, Obligations depuis sourceRaw
 * Utilise Ollama (local IA) avec prompts spÃ©cialisÃ©s CESEDA
 *
 * Flow:
 * 1. RÃ©cupÃ¨re workspace
 * 2. Appelle WorkspaceExtractionService
 * 3. CrÃ©e entitÃ©s en base (Facts, Contexts, Obligations)
 * 4. Transition automatique vers FACTS_EXTRACTED ou CONTEXT_IDENTIFIED
 * 5. Retourne rÃ©sumÃ© extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { getSecurePrisma } from '@/lib/prisma';;
import { workspaceExtractionService } from '@/lib/ai/workspace-extraction-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const prisma = await getSecurePrisma();
  try {
    // 1. Authentification
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const workspaceId = params.id;

    // 2. RÃ©cupÃ©ration workspace
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvÃ©' }, { status: 404 });
    }

    // 3. VÃ©rification ownership (tenant isolation)
    if (workspace.tenantId !== (session.user as any).tenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    // 4. VÃ©rification Ã©tat (seulement RECEIVED autorisÃ©)
    if (workspace.currentState !== 'RECEIVED') {
      return NextResponse.json(
        {
          error: `Extraction impossible depuis l'Ã©tat ${workspace.currentState}. Ã‰tat RECEIVED requis.`,
        },
        { status: 400 }
      );
    }

    // 5. VÃ©rification workspace non verrouillÃ©
    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillÃ© - Extraction impossible' },
        { status: 400 }
      );
    }

    // 6. Parse request body (options d'extraction)
    let options = { autoTransition: true };
    try {
      const body = await request.json();
      options = { ...options, ...body };
    } catch {
      // Body vide = options par dÃ©faut
    }

    // 7. Appel service d'extraction IA
    logger.info('DÃ©marrage extraction IA', {
      workspaceId,
      route: '/api/workspace-reasoning/[id]/extract',
    });
    const extractionResult = await workspaceExtractionService.extractFromWorkspace(workspace);

    if (!extractionResult.success) {
      return NextResponse.json(
        {
          error: 'Ã‰chec extraction IA',
          details: extractionResult.error,
          model: extractionResult.model,
        },
        { status: 500 }
      );
    }

    logger.info('Extraction IA rÃ©ussie', {
      workspaceId,
      facts: extractionResult.facts.length,
      contexts: extractionResult.contexts.length,
      obligations: extractionResult.obligations.length,
    });

    // 8. Validation extraction
    const validation = workspaceExtractionService.validateExtraction(extractionResult);
    logger.debug('Validation extraction', {
      valid: validation.valid,
      warnings: validation.warnings.length,
    });

    // 9. CrÃ©ation entitÃ©s en base
    const createdEntities = {
      facts: [] as any[],
      contexts: [] as any[],
      obligations: [] as any[],
    };

    // CrÃ©er Facts
    for (const fact of extractionResult.facts) {
      const created = await prisma.fact.create({
        data: {
          workspaceId: workspace.id,
          label: fact.label,
          value: fact.value,
          source: fact.source,
          sourceRef: fact.sourceRef,
          confidence: fact.confidence,
          extractedBy: 'AI',
        },
      });
      createdEntities.facts.push(created);
    }

    // CrÃ©er Contexts
    for (const context of extractionResult.contexts) {
      const created = await prisma.contextHypothesis.create({
        data: {
          workspaceId: workspace.id,
          type: context.type,
          description: context.description,
          reasoning: context.reasoning,
          certaintyLevel: context.certaintyLevel,
          identifiedBy: 'AI',
        },
      });
      createdEntities.contexts.push(created);
    }

    // CrÃ©er Obligations (liÃ©es au premier contexte si disponible)
    const firstContext = createdEntities.contexts[0];
    for (const obligation of extractionResult.obligations) {
      const created = await prisma.obligation.create({
        data: {
          workspaceId: workspace.id,
          contextId: firstContext?.id || createdEntities.contexts[0]?.id,
          description: obligation.description,
          mandatory: obligation.mandatory,
          deadline: obligation.deadline ? new Date(obligation.deadline) : null,
          critical: obligation.critical,
          legalRef: obligation.legalRef,
          deducedBy: 'AI',
        },
      });
      createdEntities.obligations.push(created);
    }

    // 10. CrÃ©er trace de raisonnement
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'AI Extraction automatique',
        explanation: `Extraction IA rÃ©ussie: ${extractionResult.facts.length} faits, ${extractionResult.contexts.length} contextes, ${extractionResult.obligations.length} obligations (confiance: ${(extractionResult.confidence * 100).toFixed(0)}%)`,
        metadata: JSON.stringify({
          model: extractionResult.model,
          processingTime: extractionResult.processingTime,
          confidence: extractionResult.confidence,
          validation: validation,
        }),
        createdBy: 'AI',
      },
    });

    // 11. Transition automatique si demandÃ©
    let newState = workspace.currentState;
    if (options.autoTransition && extractionResult.facts.length > 0) {
      // DÃ©terminer nouvel Ã©tat
      if (extractionResult.contexts.length > 0) {
        newState = 'CONTEXT_IDENTIFIED';
      } else {
        newState = 'FACTS_EXTRACTED';
      }

      // Mettre Ã  jour workspace
      await prisma.workspaceReasoning.update({
        where: { id: workspace.id },
        data: {
          currentState: newState,
          stateChangedAt: new Date(),
          stateChangedBy: 'AI',
        },
      });

      // CrÃ©er transition record
      await prisma.reasoningTransition.create({
        data: {
          workspaceId: workspace.id,
          fromState: 'RECEIVED',
          toState: newState,
          triggeredBy: 'AI',
          reason: `Extraction automatique rÃ©ussie avec ${extractionResult.facts.length} faits`,
          autoApproved: false, // NÃ©cessite validation humaine
          metadata: JSON.stringify({ extractionResult }),
        },
      });

      logger.info('Transition automatique', {
        workspaceId,
        fromState: 'RECEIVED',
        toState: newState,
      });
    }

    // 12. RÃ©ponse succÃ¨s
    return NextResponse.json({
      success: true,
      extraction: {
        factsCreated: createdEntities.facts.length,
        contextsCreated: createdEntities.contexts.length,
        obligationsCreated: createdEntities.obligations.length,
        confidence: extractionResult.confidence,
        processingTime: extractionResult.processingTime,
        model: extractionResult.model,
      },
      validation: {
        valid: validation.valid,
        warnings: validation.warnings,
      },
      workspace: {
        id: workspace.id,
        previousState: 'RECEIVED',
        currentState: newState,
        transitioned: options.autoTransition && newState !== 'RECEIVED',
      },
      entities: createdEntities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erreur extraction IA', error instanceof Error ? error : undefined, {
      route: '/api/workspace-reasoning/[id]/extract',
    });

    return NextResponse.json(
      {
        error: "Erreur lors de l'extraction IA",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

