/**
 * Service de gestion des transitions d'etat du Workspace Reasoning
 * Applique les regles de validation et cree les audit trails
 */

import { WorkspaceReasoning, WorkspaceState, ReasoningTransition } from '@/types/workspace-reasoning';

export class WorkspaceReasoningService {
  /**
   * Verifie si un workspace peut passer a READY_FOR_HUMAN
   * ReGLE #5: Pas de passage si blocking = true non resolu
   */
  static canTransitionToReadyForHuman(workspace: WorkspaceReasoning): {
    canTransition: boolean;
    reason?: string;
  } {
    const blockingMissing = workspace.missingElements?.filter(m => m.blocking && !m.resolved) || [];
    
    if (blockingMissing.length > 0) {
      return {
        canTransition: false,
        reason: `${blockingMissing.length} element${blockingMissing.length > 1 ? 's' : ''} bloquant${blockingMissing.length > 1 ? 's' : ''} non resolu${blockingMissing.length > 1 ? 's' : ''}`,
      };
    }
    
    // Verifier que tous les etats precedents ont ete completes
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
        reason: `etat actuel (${workspace.currentState}) doit d'abord completer les etapes precedentes`,
      };
    }
    
    return { canTransition: true };
  }
  
  /**
   * Valide une transition d'etat
   */
  static validateStateTransition(
    currentState: WorkspaceState,
    targetState: WorkspaceState,
    workspace: WorkspaceReasoning
  ): { valid: boolean; reason?: string } {
    // Ordre des etats
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
    
    // On ne peut pas revenir en arriere (sauf pour correction)
    if (targetIndex < currentIndex) {
      return {
        valid: false,
        reason: 'Impossible de revenir a un etat precedent sans validation explicite',
      };
    }
    
    // On ne peut pas sauter d'etat
    if (targetIndex > currentIndex + 1) {
      return {
        valid: false,
        reason: 'Impossible de sauter des etats - progression sequentielle requise',
      };
    }
    
    // Validations specifiques par etat cible
    switch (targetState) {
      case 'FACTS_EXTRACTED':
        // Aucune validation speciale
        break;
        
      case 'CONTEXT_IDENTIFIED':
        if (!workspace.facts || workspace.facts.length === 0) {
          return {
            valid: false,
            reason: 'Au moins un fait doit etre extrait avant d\'identifier le contexte',
          };
        }
        break;
        
      case 'OBLIGATIONS_DEDUCED':
        const confirmedContexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED') || [];
        if (confirmedContexts.length === 0) {
          return {
            valid: false,
            reason: 'Au moins un contexte doit etre confirme avant de deduire les obligations',
          };
        }
        break;
        
      case 'MISSING_IDENTIFIED':
        // Aucune validation speciale (obligations peuvent etre vides)
        break;
        
      case 'RISK_EVALUATED':
        // Aucune validation speciale (manques peuvent etre vides)
        break;
        
      case 'ACTION_PROPOSED':
        // Aucune validation speciale (risques peuvent etre vides)
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
   * Cree un enregistrement de transition (audit trail)
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
      hash: undefined, // Calcule cote serveur avec donnees completes
      createdAt: new Date(),
    };
  }
  
  /**
   * Calcule le niveau d'incertitude base sur les manques
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
   * Calcule la qualite du raisonnement
   */
  static calculateReasoningQuality(workspace: WorkspaceReasoning): number {
    let quality = 1.0;
    
    // Penalites
    const facts = workspace.facts || [];
    const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED') || [];
    const obligations = workspace.obligations || [];
    
    // Manque de faits = mauvaise qualite
    if (facts.length === 0) {
      quality -= 0.4;
    } else if (facts.length < 3) {
      quality -= 0.2;
    }
    
    // Manque de contextes confirmes
    if (contexts.length === 0) {
      quality -= 0.3;
    }
    
    // Obligations sans base legale
    const obligationsWithoutRef = obligations.filter(o => !o.legalRef).length;
    if (obligationsWithoutRef > 0) {
      quality -= 0.1 * (obligationsWithoutRef / obligations.length);
    }
    
    // Faits sans source explicite (user_provided)
    const userProvidedFacts = facts.filter(f => f.source === 'USER_PROVIDED').length;
    if (userProvidedFacts > facts.length * 0.5) {
      quality -= 0.2; // Trop de faits non sources
    }
    
    return Math.max(0.0, quality);
  }
  
  /**
   * Met a jour les metriques du workspace
   */
  static updateWorkspaceMetrics(workspace: WorkspaceReasoning): Partial<WorkspaceReasoning> {
    return {
      uncertaintyLevel: this.calculateUncertaintyLevel(workspace),
      reasoningQuality: this.calculateReasoningQuality(workspace),
      updatedAt: new Date(),
    };
  }
  
  /**
   * Verifie si le workspace est pret a etre verrouille
   */
  static canLockWorkspace(workspace: WorkspaceReasoning): boolean {
    return (
      workspace.currentState === 'READY_FOR_HUMAN' &&
      !workspace.locked &&
      this.canTransitionToReadyForHuman(workspace).canTransition
    );
  }
  
  /**
   * Genere un resume executif du workspace
   */
  static generateExecutiveSummary(workspace: WorkspaceReasoning): string {
    const facts = workspace.facts?.length || 0;
    const contexts = workspace.contextHypotheses?.filter(c => c.certaintyLevel === 'CONFIRMED').length || 0;
    const obligations = workspace.obligations?.length || 0;
    const blocking = workspace.missingElements?.filter(m => m.blocking && !m.resolved).length || 0;
    const risks = workspace.risks?.filter(r => r.riskScore >= 6).length || 0;
    
    let summary = `Workspace ${workspace.id}\n`;
    summary += `etat: ${workspace.currentState}\n`;
    summary += `Incertitude: ${(workspace.uncertaintyLevel * 100).toFixed(0)}%\n`;
    summary += `Qualite: ${(workspace.reasoningQuality * 100).toFixed(0)}%\n\n`;
    summary += ` elements identifies:\n`;
    summary += `- ${facts} fait${facts > 1 ? 's' : ''} certain${facts > 1 ? 's' : ''}\n`;
    summary += `- ${contexts} contexte${contexts > 1 ? 's' : ''} confirme${contexts > 1 ? 's' : ''}\n`;
    summary += `- ${obligations} obligation${obligations > 1 ? 's' : ''}\n`;
    
    if (blocking > 0) {
      summary += `\n️ ${blocking} element${blocking > 1 ? 's' : ''} bloquant${blocking > 1 ? 's' : ''}\n`;
    }
    
    if (risks > 0) {
      summary += `\n[emoji] ${risks} risque${risks > 1 ? 's' : ''} critique${risks > 1 ? 's' : ''}\n`;
    }
    
    return summary;
  }
}
