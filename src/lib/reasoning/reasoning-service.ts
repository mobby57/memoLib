/**
 * [emoji] SERVICE DE RAISONNEMENT IA
 * 
 * Execute le raisonnement structure a travers les 8 etats
 * en utilisant Ollama (llama3.2) avec les prompts definis.
 */

import { ollama } from '@/lib/ai/ollama-client';
import { prisma } from '@/lib/prisma';
import {
  getPromptForTransition,
  fillPromptTemplate,
  buildPromptContext,
} from './prompts';
import { WorkspaceState } from '@/types/workspace-reasoning';

interface ReasoningResult {
  success: boolean;
  newState?: WorkspaceState;
  uncertaintyLevel?: number;
  data?: any;
  error?: string;
  traces?: Array<{ step: string; explanation: string }>;
}

/**
 * Executer une transition de raisonnement
 */
export async function executeReasoning(
  workspaceId: string,
  toState: WorkspaceState
): Promise<ReasoningResult> {
  try {
    // 1. Charger le workspace avec toutes les relations
    const workspace = await prisma.workspaceReasoning.findUnique({
      where: { id: workspaceId },
      include: {
        facts: true,
        contexts: true,
        obligations: true,
        missingElements: true,
        risks: true,
        proposedActions: true,
      },
    });

    if (!workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    if (workspace.locked) {
      return { success: false, error: 'Workspace is locked' };
    }

    const fromState = workspace.currentState;

    // 2. Obtenir le prompt approprie
    const promptTemplate = getPromptForTransition(fromState, toState);
    if (!promptTemplate) {
      return {
        success: false,
        error: `No prompt defined for transition ${fromState} [Next] ${toState}`,
      };
    }

    // 3. Construire le contexte
    const context = buildPromptContext(workspace);
    const prompt = fillPromptTemplate(promptTemplate, context);

    // 4. Appeler Ollama
    const aiAvailable = await ollama.isAvailable();
    if (!aiAvailable) {
      return {
        success: false,
        error: 'Ollama is not available. Please start Ollama server.',
      };
    }

    console.log(`[emoji] Executing reasoning: ${fromState} [Next] ${toState}`);
    console.log(`[emoji] Prompt length: ${prompt.length} chars`);

    const aiResponse = await ollama.generateJSON(prompt);

    console.log(` AI Response received:`, aiResponse);

    // 5. Valider la structure de la reponse
    if (!aiResponse || typeof aiResponse !== 'object') {
      return {
        success: false,
        error: 'Invalid AI response format',
      };
    }

    // 6. Appliquer les resultats selon l'etat cible
    await applyReasoningResults(workspaceId, toState, aiResponse);

    // 7. Mettre a jour l'etat du workspace
    await prisma.workspaceReasoning.update({
      where: { id: workspaceId },
      data: {
        currentState: toState,
        uncertaintyLevel: aiResponse.uncertaintyLevel || workspace.uncertaintyLevel,
        stateChangedAt: new Date(),
        stateChangedBy: 'AI',
      },
    });

    // 8. Creer la transition
    await prisma.reasoningTransition.create({
      data: {
        workspaceId,
        fromState,
        toState,
        triggeredBy: 'AI',
        reason: aiResponse.traces?.[0]?.explanation || 'AI reasoning executed',
        autoApproved: true,
      },
    });

    return {
      success: true,
      newState: toState,
      uncertaintyLevel: aiResponse.uncertaintyLevel,
      data: aiResponse,
      traces: aiResponse.traces,
    };
  } catch (error) {
    console.error(' Reasoning execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Appliquer les resultats du raisonnement a la base de donnees
 */
async function applyReasoningResults(
  workspaceId: string,
  state: WorkspaceState,
  aiResponse: any
): Promise<void> {
  switch (state) {
    case 'FACTS_EXTRACTED':
      if (aiResponse.facts && Array.isArray(aiResponse.facts)) {
        await prisma.fact.createMany({
          data: aiResponse.facts.map((fact: any) => ({
            workspaceId,
            label: fact.label,
            value: fact.value,
            source: fact.source,
            sourceRef: fact.sourceRef,
            confidence: fact.confidence || 1.0,
            extractedBy: 'AI',
          })),
        });
      }
      break;

    case 'CONTEXT_IDENTIFIED':
      if (aiResponse.contexts && Array.isArray(aiResponse.contexts)) {
        await prisma.contextHypothesis.createMany({
          data: aiResponse.contexts.map((ctx: any) => ({
            workspaceId,
            type: ctx.type,
            description: ctx.description,
            reasoning: ctx.reasoning,
            certaintyLevel: ctx.certaintyLevel || 'POSSIBLE',
            identifiedBy: 'AI',
          })),
        });
      }
      break;

    case 'OBLIGATIONS_DEDUCED':
      if (aiResponse.obligations && Array.isArray(aiResponse.obligations)) {
        // Recuperer les contextes pour le mapping
        const contexts = await prisma.contextHypothesis.findMany({
          where: { workspaceId },
          select: { id: true },
        });

        if (contexts.length > 0) {
          await prisma.obligation.createMany({
            data: aiResponse.obligations.map((obl: any, idx: number) => ({
              workspaceId,
              contextId: contexts[idx % contexts.length].id, // Simple mapping
              description: obl.description,
              mandatory: obl.mandatory ?? true,
              deadline: obl.deadline ? new Date(obl.deadline) : null,
              critical: obl.critical ?? false,
              legalRef: obl.legalRef,
              deducedBy: 'AI',
            })),
          });
        }
      }
      break;

    case 'MISSING_IDENTIFIED':
      if (aiResponse.missingElements && Array.isArray(aiResponse.missingElements)) {
        await prisma.missingElement.createMany({
          data: aiResponse.missingElements.map((missing: any) => ({
            workspaceId,
            type: missing.type,
            description: missing.description,
            why: missing.why,
            blocking: missing.blocking ?? true,
            identifiedBy: 'AI',
          })),
        });
      }
      break;

    case 'RISK_EVALUATED':
      if (aiResponse.risks && Array.isArray(aiResponse.risks)) {
        await prisma.risk.createMany({
          data: aiResponse.risks.map((risk: any) => {
            const impactMap: Record<string, number> = { LOW: 3, MEDIUM: 6, HIGH: 9 };
            const probabilityMap: Record<string, number> = { LOW: 3, MEDIUM: 6, HIGH: 9 };
            const impact = impactMap[risk.impact] || 3;
            const probability = probabilityMap[risk.probability] || 3;
            
            return {
              workspaceId,
              description: risk.description,
              impact: risk.impact,
              probability: risk.probability,
              riskScore: impact * probability,
              irreversible: risk.irreversible ?? false,
              evaluatedBy: 'AI',
            };
          }),
        });
      }
      break;

    case 'ACTION_PROPOSED':
      if (aiResponse.proposedActions && Array.isArray(aiResponse.proposedActions)) {
        await prisma.proposedAction.createMany({
          data: aiResponse.proposedActions.map((action: any) => ({
            workspaceId,
            type: action.type,
            content: action.content,
            reasoning: action.reasoning,
            target: action.target,
            priority: action.priority || 'NORMAL',
            proposedBy: 'AI',
          })),
        });
      }
      break;

    case 'READY_FOR_HUMAN':
      // Pas de creation d'entites, juste validation
      // Peut etre verrouille par l'humain
      break;
  }

  // Creer les traces de raisonnement
  if (aiResponse.traces && Array.isArray(aiResponse.traces)) {
    await prisma.reasoningTrace.createMany({
      data: aiResponse.traces.map((trace: any) => ({
        workspaceId,
        step: trace.step,
        explanation: trace.explanation,
        metadata: trace.metadata ? JSON.stringify(trace.metadata) : null,
        createdBy: 'AI',
      })),
    });
  }
}

/**
 * Executer le raisonnement complet (RECEIVED [Next] READY_FOR_HUMAN)
 */
export async function executeFullReasoning(workspaceId: string): Promise<{
  success: boolean;
  finalState?: WorkspaceState;
  steps?: Array<{ state: WorkspaceState; uncertaintyLevel: number }>;
  error?: string;
}> {
  const states: WorkspaceState[] = [
    'FACTS_EXTRACTED',
    'CONTEXT_IDENTIFIED',
    'OBLIGATIONS_DEDUCED',
    'MISSING_IDENTIFIED',
    'RISK_EVALUATED',
    'ACTION_PROPOSED',
    'READY_FOR_HUMAN',
  ];

  const steps: Array<{ state: WorkspaceState; uncertaintyLevel: number }> = [];

  for (const state of states) {
    const result = await executeReasoning(workspaceId, state);

    if (!result.success) {
      return {
        success: false,
        error: `Failed at ${state}: ${result.error}`,
      };
    }

    steps.push({
      state,
      uncertaintyLevel: result.uncertaintyLevel || 1.0,
    });

    // Si on atteint MISSING_IDENTIFIED avec des bloquants, on s'arrete
    if (state === 'MISSING_IDENTIFIED') {
      const workspace = await prisma.workspaceReasoning.findUnique({
        where: { id: workspaceId },
        include: { missingElements: true },
      });

      const hasBlockingUnresolved = workspace?.missingElements.some(
        (m) => m.blocking && !m.resolved
      );

      if (hasBlockingUnresolved) {
        return {
          success: true,
          finalState: 'MISSING_IDENTIFIED',
          steps,
        };
      }
    }

    // Petite pause entre les etapes pour eviter de surcharger Ollama
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    success: true,
    finalState: 'READY_FOR_HUMAN',
    steps,
  };
}

/**
 * Executer une seule etape (step-by-step)
 */
export async function executeNextStep(workspaceId: string): Promise<ReasoningResult> {
  const workspace = await prisma.workspaceReasoning.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    return { success: false, error: 'Workspace not found' };
  }

  const stateOrder: WorkspaceState[] = [
    'RECEIVED',
    'FACTS_EXTRACTED',
    'CONTEXT_IDENTIFIED',
    'OBLIGATIONS_DEDUCED',
    'MISSING_IDENTIFIED',
    'RISK_EVALUATED',
    'ACTION_PROPOSED',
    'READY_FOR_HUMAN',
  ];

  const currentIndex = stateOrder.indexOf(workspace.currentState);
  if (currentIndex === -1 || currentIndex === stateOrder.length - 1) {
    return { success: false, error: 'Already at final state or invalid state' };
  }

  const nextState = stateOrder[currentIndex + 1];
  return executeReasoning(workspaceId, nextState);
}
