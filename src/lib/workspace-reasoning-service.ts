/**
 * Service de gestion des transitions d'état du Workspace Reasoning
 * Applique les règles de validation et crée les audit trails
 */

import { WorkspaceReasoning, WorkspaceState, ReasoningTransition } from '@/types/workspace-reasoning';

export class WorkspaceReasoningService {
  /**
   * Vérifie si un workspace peut passer à READY_FOR_HUMAN
   * RÈGLE #5: Pas de passage si blocking = true non résolu
   */
  static canTransitionToReadyForHuman(workspace: WorkspaceReasoning): {
    canTransition: boolean;
    reason?: string;
  } {
    const blockingMissing = workspace.missingElements?.filter(m => m.blocking && !m.resolved) || [];
    
    if (blockingMissing.length > 0) {
      return {
        canTransition: false,
        reason: `${blockingMissing.length} élément${blockingMissing.length > 1 ? 's' : ''} bloquant${blockingMissing.length > 1 ? 's' : ''} non résolu${blockingMissing.length > 1 ? 's' : ''}`,
      };
    }
    
    // Vérifier que tous les états précédents ont été complétés
    const requiredStates: WorkspaceState[] = [
      'RECEIVED',
      'FACTS_EXTRACTED',
      'CONTEXT_IDENTIFIED',
      'OBLIGATIONS_DEDUCED',
      'MISSING_IDENTIFIED',
      'RISK_EVALUATED',
      'ACTION_PROPOSED',
    ];
    
    const currentStateIndex = requiredStates.indexOf(workspace.currentState);
    if (currentStateIndex < requiredStates.length - 1) {
      return {
        canTransition: false,
        reason: `État actuel (${workspace.currentState}) doit d'abord compléter les étapes précédentes`,
      };
    }
    
    return { canTransition: true };
  }
  
  /**
   * Valide une transition d'état
   */
  static validateStateTransition(
    currentState: WorkspaceState,
    targetState: WorkspaceState,
    workspace: WorkspaceReasoning
  ): { valid: boolean; reason?: string } {
    // Ordre des états
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
    
    const currentIndex = stateOrder.indexOf(currentState);
    const targetIndex = stateOrder.indexOf(targetState);
    
    // On ne peut pas revenir en arrière (sauf pour correction)
    if (targetIndex < currentIndex) {
      return {
        valid: false,
        reason: 'Impossible de revenir à un état précédent sans validation explicite',
      };
    }
    
    // On ne peut pas sauter d'état
    if (targetIndex > currentIndex + 1) {
      return {
        valid: false,
        reason: 'Impossible de sauter des états - progression séquentielle requise',
      };
    }
    
    // Validations spécifiques par état cible
    switch (targetState) {
      case 'FACTS_EXTRACTED':
        // Aucune validation spéciale
        break;
        
      case 'CONTEXT_IDENTIFIED':
        if (!workspace.facts || workspace.facts.length === 0) {
          return {
            valid: false,
            reason: 'Au moins un fait doit être extrait avant d\'identifier le contexte',
          };
        }
        break;
        
      case 'OBLIGATIONS_DEDUCED':
        const confirmedContexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED') || [];
        if (confirmedContexts.length === 0) {
          return {
            valid: false,
            reason: 'Au moins un contexte doit être confirmé avant de déduire les obligations',
          };
        }
        break;
        
      case 'MISSING_IDENTIFIED':
        // Aucune validation spéciale (obligations peuvent être vides)
        break;
        
      case 'RISK_EVALUATED':
        // Aucune validation spéciale (manques peuvent être vides)
        break;
        
      case 'ACTION_PROPOSED':
        // Aucune validation spéciale (risques peuvent être vides)
        break;
        
      case 'READY_FOR_HUMAN':
        const readyCheck = this.canTransitionToReadyForHuman(workspace);
        if (!readyCheck.canTransition) {
          return {
            valid: false,
            reason: readyCheck.reason,
          };
        }
        break;
    }
    
    return { valid: true };
  }
  
  /**
   * Crée un enregistrement de transition (audit trail)
   */
  static createTransitionRecord(
    workspace: WorkspaceReasoning,
    fromState: WorkspaceState,
    toState: WorkspaceState,
    triggeredBy: string,
    reason: string
  ): ReasoningTransition {
    return {
      id: crypto.randomUUID(),
      workspaceId: workspace.id,
      fromState,
      toState,
      triggeredBy,
      triggeredAt: new Date(),
      reason,
      autoApproved: false,
      validatedBy: undefined,
      validatedAt: undefined,
      stateBefore: JSON.stringify({
        currentState: workspace.currentState,
        uncertaintyLevel: workspace.uncertaintyLevel,
        reasoningQuality: workspace.reasoningQuality,
      }),
      stateAfter: JSON.stringify({
        currentState: toState,
        uncertaintyLevel: workspace.uncertaintyLevel,
        reasoningQuality: workspace.reasoningQuality,
      }),
      hash: undefined, // Calculé côté serveur avec données complètes
      createdAt: new Date(),
    };
  }
  
  /**
   * Calcule le niveau d'incertitude basé sur les manques
   */
  static calculateUncertaintyLevel(workspace: WorkspaceReasoning): number {
    const missingElements = workspace.missingElements || [];
    
    if (missingElements.length === 0) {
      return 0.0; // Aucune incertitude
    }
    
    const blocking = missingElements.filter(m => m.blocking && !m.resolved).length;
    const nonBlocking = missingElements.filter(m => !m.blocking && !m.resolved).length;
    
    // Formule: blocking compte pour 0.3 chacun, non-blocking pour 0.1
    const uncertaintyScore = (blocking * 0.3) + (nonBlocking * 0.1);
    
    // Normaliser entre 0 et 1
    return Math.min(1.0, uncertaintyScore);
  }
  
  /**
   * Calcule la qualité du raisonnement
   */
  static calculateReasoningQuality(workspace: WorkspaceReasoning): number {
    let quality = 1.0;
    
    // Pénalités
    const facts = workspace.facts || [];
    const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED') || [];
    const obligations = workspace.obligations || [];
    
    // Manque de faits = mauvaise qualité
    if (facts.length === 0) {
      quality -= 0.4;
    } else if (facts.length < 3) {
      quality -= 0.2;
    }
    
    // Manque de contextes confirmés
    if (contexts.length === 0) {
      quality -= 0.3;
    }
    
    // Obligations sans base légale
    const obligationsWithoutRef = obligations.filter(o => !o.legalRef).length;
    if (obligationsWithoutRef > 0) {
      quality -= 0.1 * (obligationsWithoutRef / obligations.length);
    }
    
    // Faits sans source explicite (user_provided)
    const userProvidedFacts = facts.filter(f => f.source === 'USER_PROVIDED').length;
    if (userProvidedFacts > facts.length * 0.5) {
      quality -= 0.2; // Trop de faits non sourcés
    }
    
    return Math.max(0.0, quality);
  }
  
  /**
   * Met à jour les métriques du workspace
   */
  static updateWorkspaceMetrics(workspace: WorkspaceReasoning): Partial<WorkspaceReasoning> {
    return {
      uncertaintyLevel: this.calculateUncertaintyLevel(workspace),
      reasoningQuality: this.calculateReasoningQuality(workspace),
      updatedAt: new Date(),
    };
  }
  
  /**
   * Vérifie si le workspace est prêt à être verrouillé
   */
  static canLockWorkspace(workspace: WorkspaceReasoning): boolean {
    return (
      workspace.currentState === 'READY_FOR_HUMAN' &&
      !workspace.locked &&
      this.canTransitionToReadyForHuman(workspace).canTransition
    );
  }
  
  /**
   * Génère un résumé exécutif du workspace
   */
  static generateExecutiveSummary(workspace: WorkspaceReasoning): string {
    const facts = workspace.facts?.length || 0;
    const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED').length || 0;
    const obligations = workspace.obligations?.length || 0;
    const blocking = workspace.missingElements?.filter(m => m.blocking && !m.resolved).length || 0;
    const risks = workspace.risks?.filter(r => r.riskScore >= 6).length || 0;
    
    let summary = `Workspace ${workspace.id}\n`;
    summary += `État: ${workspace.currentState}\n`;
    summary += `Incertitude: ${(workspace.uncertaintyLevel * 100).toFixed(0)}%\n`;
    summary += `Qualité: ${(workspace.reasoningQuality * 100).toFixed(0)}%\n\n`;
    summary += `📊 Éléments identifiés:\n`;
    summary += `- ${facts} fait${facts > 1 ? 's' : ''} certain${facts > 1 ? 's' : ''}\n`;
    summary += `- ${contexts} contexte${contexts > 1 ? 's' : ''} confirmé${contexts > 1 ? 's' : ''}\n`;
    summary += `- ${obligations} obligation${obligations > 1 ? 's' : ''}\n`;
    
    if (blocking > 0) {
      summary += `\n⚠️ ${blocking} élément${blocking > 1 ? 's' : ''} bloquant${blocking > 1 ? 's' : ''}\n`;
    }
    
    if (risks > 0) {
      summary += `\n🔴 ${risks} risque${risks > 1 ? 's' : ''} critique${risks > 1 ? 's' : ''}\n`;
    }
    
    return summary;
  }
}
