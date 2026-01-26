/**
 * API ENDPOINT: AI EXTRACTION
 * 
 * POST /api/workspace-reasoning/[id]/extract
 * 
 * Extrait automatiquement Facts, Contexts, Obligations depuis sourceRaw
 * Utilise Ollama (local IA) avec prompts spécialisés CESEDA
 * 
 * Flow:
 * 1. Récupère workspace
 * 2. Appelle WorkspaceExtractionService
 * 3. Crée entités en base (Facts, Contexts, Obligations)
 * 4. Transition automatique vers FACTS_EXTRACTED ou CONTEXT_IDENTIFIED
 * 5. Retourne résumé extraction
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { workspaceExtractionService } from '@/lib/ai/workspace-extraction-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentification
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const workspaceId = params.id;

    // 2. Récupération workspace
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace non trouvé' },
        { status: 404 }
      );
    }

    // 3. Vérification ownership (tenant isolation)
    if (workspace.tenantId !== (session.user as any).tenantId) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    // 4. Vérification état (seulement RECEIVED autorisé)
    if (workspace.currentState !== 'RECEIVED') {
      return NextResponse.json(
        { error: `Extraction impossible depuis l'état ${workspace.currentState}. État RECEIVED requis.` },
        { status: 400 }
      );
    }

    // 5. Vérification workspace non verrouillé
    if (workspace.locked) {
      return NextResponse.json(
        { error: 'Workspace verrouillé - Extraction impossible' },
        { status: 400 }
      );
    }

    // 6. Parse request body (options d'extraction)
    let options = { autoTransition: true };
    try {
      const body = await request.json();
      options = { ...options, ...body };
    } catch {
      // Body vide = options par défaut
    }

    // 7. Appel service d'extraction IA
    console.log(`[AI Extraction] Démarrage pour workspace ${workspaceId}...`);
    const extractionResult = await workspaceExtractionService.extractFromWorkspace(workspace);

    if (!extractionResult.success) {
      return NextResponse.json(
        { 
          error: 'Échec extraction IA',
          details: extractionResult.error,
          model: extractionResult.model,
        },
        { status: 500 }
      );
    }

    console.log(`[AI Extraction] Succès - ${extractionResult.facts.length} faits, ${extractionResult.contexts.length} contextes, ${extractionResult.obligations.length} obligations`);

    // 8. Validation extraction
    const validation = workspaceExtractionService.validateExtraction(extractionResult);
    console.log(`[AI Extraction] Validation: ${validation.valid ? 'OK' : 'Warnings'} - ${validation.warnings.length} warning(s)`);

    // 9. Création entités en base
    const createdEntities = {
      facts: [] as any[],
      contexts: [] as any[],
      obligations: [] as any[],
    };

    // Créer Facts
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

    // Créer Contexts
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

    // Créer Obligations (liées au premier contexte si disponible)
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

    // 10. Créer trace de raisonnement
    await prisma.reasoningTrace.create({
      data: {
        workspaceId: workspace.id,
        step: 'AI Extraction automatique',
        explanation: `Extraction IA réussie: ${extractionResult.facts.length} faits, ${extractionResult.contexts.length} contextes, ${extractionResult.obligations.length} obligations (confiance: ${(extractionResult.confidence * 100).toFixed(0)}%)`,
        metadata: JSON.stringify({
          model: extractionResult.model,
          processingTime: extractionResult.processingTime,
          confidence: extractionResult.confidence,
          validation: validation,
        }),
        createdBy: 'AI',
      },
    });

    // 11. Transition automatique si demandé
    let newState = workspace.currentState;
    if (options.autoTransition && extractionResult.facts.length > 0) {
      // Déterminer nouvel état
      if (extractionResult.contexts.length > 0) {
        newState = 'CONTEXT_IDENTIFIED';
      } else {
        newState = 'FACTS_EXTRACTED';
      }

      // Mettre à jour workspace
      await prisma.workspaceReasoning.update({
        where: { id: workspace.id },
        data: {
          currentState: newState,
          stateChangedAt: new Date(),
          stateChangedBy: 'AI',
        },
      });

      // Créer transition record
      await prisma.reasoningTransition.create({
        data: {
          workspaceId: workspace.id,
          fromState: 'RECEIVED',
          toState: newState,
          triggeredBy: 'AI',
          reason: `Extraction automatique réussie avec ${extractionResult.facts.length} faits`,
          autoApproved: false, // Nécessite validation humaine
          metadata: JSON.stringify({ extractionResult }),
        },
      });

      console.log(`[AI Extraction] Transition automatique: RECEIVED → ${newState}`);
    }

    // 12. Réponse succès
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
    console.error('[AI Extraction] Erreur:', error);
    
    return NextResponse.json(
      {
        error: 'Erreur lors de l\'extraction IA',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
