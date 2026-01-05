/**
 * Service d'Apprentissage Continu IA
 * Analyse les validations humaines pour améliorer les prédictions
 */

import { prisma } from '@/lib/prisma';

export class LearningService {
  /**
   * Analyser les patterns de validation pour un tenant
   */
  static async analyzeValidationPatterns(tenantId: string, periodDays: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Récupérer toutes les actions validées de la période
    const validatedActions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        validatedAt: {
          gte: startDate
        },
        validationStatus: {
          in: ['APPROVED', 'REJECTED', 'MODIFIED_APPROVED', 'AUTO_APPROVED']
        }
      },
      orderBy: { validatedAt: 'desc' }
    });

    // Analyser par type d'action
    const actionTypeAnalysis = new Map<string, {
      total: number;
      approved: number;
      rejected: number;
      modified: number;
      avgConfidence: number;
      totalConfidence: number;
      shouldAdjust: boolean;
      adjustment: number;
    }>();

    validatedActions.forEach(action => {
      const type = action.actionType;
      const analysis = actionTypeAnalysis.get(type) || {
        total: 0,
        approved: 0,
        rejected: 0,
        modified: 0,
        avgConfidence: 0,
        totalConfidence: 0,
        shouldAdjust: false,
        adjustment: 0
      };

      analysis.total++;
      analysis.totalConfidence += action.confidence;

      switch (action.validationStatus) {
        case 'APPROVED':
        case 'AUTO_APPROVED':
          analysis.approved++;
          break;
        case 'REJECTED':
          analysis.rejected++;
          break;
        case 'MODIFIED_APPROVED':
          analysis.modified++;
          break;
      }

      actionTypeAnalysis.set(type, analysis);
    });

    // Calculer les ajustements de confiance
    const results = Array.from(actionTypeAnalysis.entries()).map(([type, analysis]) => {
      analysis.avgConfidence = analysis.total > 0 ? analysis.totalConfidence / analysis.total : 0;
      
      const successRate = analysis.total > 0 
        ? (analysis.approved + analysis.modified) / analysis.total 
        : 0;

      // Règles d'ajustement automatique
      let adjustment = 0;
      let shouldAdjust = false;

      if (analysis.total >= 10) { // Minimum 10 actions pour ajuster
        if (successRate > 0.9) {
          // Excellent taux de succès : augmenter la confiance
          adjustment = 0.05; // +5%
          shouldAdjust = true;
        } else if (successRate < 0.7) {
          // Taux de succès faible : diminuer la confiance
          adjustment = -0.1; // -10%
          shouldAdjust = true;
        }
      }

      analysis.shouldAdjust = shouldAdjust;
      analysis.adjustment = adjustment;

      return {
        actionType: type,
        ...analysis,
        successRate,
        recommendation: this.getRecommendation(successRate, analysis.total)
      };
    });

    return {
      periodDays,
      totalActions: validatedActions.length,
      actionTypes: results,
      globalSuccessRate: validatedActions.length > 0 
        ? validatedActions.filter(a => 
            a.validationStatus === 'APPROVED' || 
            a.validationStatus === 'AUTO_APPROVED' || 
            a.validationStatus === 'MODIFIED_APPROVED'
          ).length / validatedActions.length 
        : 0,
      generatedAt: new Date()
    };
  }

  /**
   * Prédire la probabilité d'approbation d'une action
   */
  static async predictApprovalProbability(
    tenantId: string, 
    actionType: string, 
    confidence: number
  ): Promise<{
    probability: number;
    recommendation: 'AUTO_APPROVE' | 'VALIDATION' | 'HIGH_RISK';
    reasoning: string;
  }> {
    // Récupérer l'historique pour ce type d'action
    const historicalActions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        actionType,
        validationStatus: {
          in: ['APPROVED', 'REJECTED', 'MODIFIED_APPROVED', 'AUTO_APPROVED']
        }
      },
      orderBy: { validatedAt: 'desc' },
      take: 100 // Dernières 100 actions
    });

    if (historicalActions.length < 5) {
      return {
        probability: 0.5,
        recommendation: 'VALIDATION',
        reasoning: 'Pas assez de données historiques pour prédire'
      };
    }

    // Analyser les actions avec une confiance similaire (±0.1)
    const similarConfidenceActions = historicalActions.filter(action => 
      Math.abs(action.confidence - confidence) <= 0.1
    );

    let probability = 0.5;
    let reasoning = '';

    if (similarConfidenceActions.length >= 3) {
      const approved = similarConfidenceActions.filter(a => 
        a.validationStatus === 'APPROVED' || 
        a.validationStatus === 'AUTO_APPROVED' ||
        a.validationStatus === 'MODIFIED_APPROVED'
      ).length;
      
      probability = approved / similarConfidenceActions.length;
      reasoning = `Basé sur ${similarConfidenceActions.length} actions similaires`;
    } else {
      // Utiliser toutes les actions du type
      const approved = historicalActions.filter(a => 
        a.validationStatus === 'APPROVED' || 
        a.validationStatus === 'AUTO_APPROVED' ||
        a.validationStatus === 'MODIFIED_APPROVED'
      ).length;
      
      probability = approved / historicalActions.length;
      reasoning = `Basé sur ${historicalActions.length} actions de ce type`;
    }

    // Déterminer la recommandation
    let recommendation: 'AUTO_APPROVE' | 'VALIDATION' | 'HIGH_RISK';
    
    if (probability >= 0.9 && confidence >= 0.8) {
      recommendation = 'AUTO_APPROVE';
    } else if (probability >= 0.7) {
      recommendation = 'VALIDATION';
    } else {
      recommendation = 'HIGH_RISK';
    }

    return {
      probability,
      recommendation,
      reasoning
    };
  }

  /**
   * Appliquer les ajustements de confiance automatiques
   */
  static async applyConfidenceAdjustments(tenantId: string) {
    const analysis = await this.analyzeValidationPatterns(tenantId);
    const adjustments = [];

    for (const actionType of analysis.actionTypes) {
      if (actionType.shouldAdjust) {
        // Dans une vraie implémentation, on mettrait à jour les paramètres du modèle IA
        // Ici on simule en enregistrant l'ajustement
        adjustments.push({
          actionType: actionType.actionType,
          oldConfidence: actionType.avgConfidence,
          adjustment: actionType.adjustment,
          newConfidence: Math.max(0, Math.min(1, actionType.avgConfidence + actionType.adjustment)),
          reason: actionType.successRate > 0.9 ? 'Excellent taux de succès' : 'Taux de succès faible'
        });
      }
    }

    return {
      adjustmentsApplied: adjustments.length,
      adjustments,
      appliedAt: new Date()
    };
  }

  /**
   * Générer un rapport d'amélioration
   */
  static async generateImprovementReport(tenantId: string) {
    const currentPeriod = await this.analyzeValidationPatterns(tenantId, 30);
    const previousPeriod = await this.analyzeValidationPatterns(tenantId, 60);

    const improvements = currentPeriod.actionTypes.map(current => {
      const previous = previousPeriod.actionTypes.find(p => p.actionType === current.actionType);
      
      if (!previous) {
        return {
          actionType: current.actionType,
          status: 'new' as const,
          currentSuccessRate: current.successRate,
          improvement: 0
        };
      }

      const improvement = current.successRate - previous.successRate;
      let status: 'improving' | 'stable' | 'declining';
      
      if (improvement > 0.05) {
        status = 'improving';
      } else if (improvement < -0.05) {
        status = 'declining';
      } else {
        status = 'stable';
      }

      return {
        actionType: current.actionType,
        status,
        currentSuccessRate: current.successRate,
        previousSuccessRate: previous.successRate,
        improvement
      };
    });

    return {
      period: '30 derniers jours vs 30-60 jours précédents',
      globalImprovement: currentPeriod.globalSuccessRate - previousPeriod.globalSuccessRate,
      improvements,
      generatedAt: new Date()
    };
  }

  /**
   * Obtenir une recommandation basée sur les performances
   */
  private static getRecommendation(successRate: number, totalActions: number): string {
    if (totalActions < 10) {
      return 'Pas assez de données pour recommander';
    }

    if (successRate > 0.9) {
      return 'Excellent - Considérer l\'auto-approbation';
    } else if (successRate > 0.8) {
      return 'Bon - Validation rapide possible';
    } else if (successRate > 0.7) {
      return 'Correct - Validation standard';
    } else {
      return 'Faible - Réviser les prompts système';
    }
  }
}