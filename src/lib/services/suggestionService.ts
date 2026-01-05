/**
 * Service de Suggestions Intelligentes
 * Propose des actions contextuelles basées sur l'historique et les patterns
 * 
 * Innovation: L'IA devient proactive et suggère des actions pertinentes
 */

import { prisma } from '@/lib/prisma';
import { AIActionType } from '@/types';

interface SmartSuggestion {
  id: string;
  title: string;
  description: string;
  actionType: AIActionType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  suggestedAction: {
    type: string;
    data: any;
  };
  confidence: number;
  estimatedTimeMinutes: number;
}

export class SuggestionService {
  /**
   * Génère des suggestions intelligentes pour un tenant
   */
  async generateSuggestions(tenantId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 1. Analyser les dossiers sans mise à jour récente
    const staleDossiers = await this.findStaleDossiers(tenantId);
    suggestions.push(...staleDossiers);

    // 2. Détecter les documents manquants récurrents
    const missingDocs = await this.findRecurringMissingDocuments(tenantId);
    suggestions.push(...missingDocs);

    // 3. Suggérer des relances clients
    const clientFollowups = await this.suggestClientFollowups(tenantId);
    suggestions.push(...clientFollowups);

    // 4. Identifier les opportunités d'automatisation
    const automationOpps = await this.findAutomationOpportunities(tenantId);
    suggestions.push(...automationOpps);

    // 5. Détecter les anomalies et incohérences
    const anomalies = await this.detectAnomalies(tenantId);
    suggestions.push(...anomalies);

    // Trier par priorité
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return suggestions.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }

  /**
   * Dossiers sans activité récente
   */
  private async findStaleDossiers(tenantId: string): Promise<SmartSuggestion[]> {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const staleDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        updatedAt: { lt: fourteenDaysAgo },
        statut: { notIn: ['CLOTURE', 'ARCHIVE'] }
      },
      take: 5,
      orderBy: { updatedAt: 'asc' }
    });

    return staleDossiers.map((dossier: { id: string; numero: string; updatedAt: Date; clientId: string }) => ({
      id: `stale-${dossier.id}`,
      title: `Dossier sans activité: ${dossier.numero}`,
      description: `Le dossier ${dossier.numero} n'a pas été mis à jour depuis ${Math.floor((Date.now() - dossier.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} jours`,
      actionType: 'GENERATE_DRAFT' as AIActionType,
      priority: 'MEDIUM',
      reasoning: 'Dossier inactif détecté. Une relance client pourrait être nécessaire.',
      suggestedAction: {
        type: 'CREATE_FOLLOWUP_EMAIL',
        data: {
          dossierId: dossier.id,
          clientId: dossier.clientId,
          template: 'TEMPLATE_REMINDER'
        }
      },
      confidence: 0.82,
      estimatedTimeMinutes: 5
    }));
  }

  /**
   * Documents manquants récurrents
   */
  private async findRecurringMissingDocuments(tenantId: string): Promise<SmartSuggestion[]> {
    // Analyser les actions passées pour trouver les documents souvent demandés
    const documentRequests = await prisma.aIAction.findMany({
      where: {
        tenantId,
        actionType: 'GENERATE_DRAFT'
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    // Compter les documents les plus demandés
    const documentCounts = new Map<string, number>();
    
    for (const action of documentRequests) {
      const output = action.metadata ? JSON.parse(action.metadata) : {};
      const documents = output?.variables?.documents || '';
      const docList = documents.split(',').map((d: string) => d.trim());
      
      docList.forEach((doc: string) => {
        if (doc) {
          documentCounts.set(doc, (documentCounts.get(doc) || 0) + 1);
        }
      });
    }

    // Créer des suggestions pour les documents fréquents
    const suggestions: SmartSuggestion[] = [];
    const threshold = 3; // Au moins 3 occurrences

    for (const [doc, count] of documentCounts) {
      if (count >= threshold) {
        suggestions.push({
          id: `recurring-doc-${doc.replace(/\s+/g, '-')}`,
          title: `Document fréquemment manquant: ${doc}`,
          description: `Le document "${doc}" a été demandé ${count} fois récemment`,
          actionType: 'GENERATE_FORM' as AIActionType,
          priority: 'LOW',
          reasoning: 'Créer un formulaire de collecte automatique pourrait réduire les demandes manuelles.',
          suggestedAction: {
            type: 'CREATE_AUTO_COLLECTION_FORM',
            data: {
              documentType: doc,
              frequency: count
            }
          },
          confidence: 0.75,
          estimatedTimeMinutes: 15
        });
      }
    }

    return suggestions;
  }

  /**
   * Suggérer des relances clients
   */
  private async suggestClientFollowups(tenantId: string): Promise<SmartSuggestion[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Trouver les dossiers avec échéance proche
    const dossiersNeedingFollowup = await prisma.dossier.findMany({
      where: {
        tenantId,
        dateEcheance: {
          gte: new Date(),
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 jours
        }
      },
      include: {
        client: true
      },
      take: 5
    });

    return dossiersNeedingFollowup.map((dossier: { id: string; numero: string; dateEcheance: Date | null; clientId: string; client: { firstName: string; lastName: string } }) => {
      const daysUntilDeadline = dossier.dateEcheance 
        ? Math.floor((dossier.dateEcheance.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      const clientName = `${dossier.client.firstName} ${dossier.client.lastName}`;

      return {
        id: `followup-${dossier.id}`,
        title: `Relance client: ${clientName}`,
        description: `Échéance dans ${daysUntilDeadline} jours pour le dossier ${dossier.numero}`,
        actionType: 'GENERATE_DRAFT' as AIActionType,
        priority: daysUntilDeadline <= 7 ? 'HIGH' : 'MEDIUM',
        reasoning: `Échéance proche (${daysUntilDeadline}j). Relance recommandée.`,
        suggestedAction: {
          type: 'SEND_REMINDER',
          data: {
            dossierId: dossier.id,
            clientId: dossier.clientId,
            deadline: dossier.dateEcheance
          }
        },
        confidence: 0.88,
        estimatedTimeMinutes: 3
      };
    });
  }

  /**
   * Identifier les opportunités d'automatisation
   */
  private async findAutomationOpportunities(tenantId: string): Promise<SmartSuggestion[]> {
    // Analyser les actions manuelles répétitives
    const recentActions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compter les types d'actions
    const actionTypeCounts = new Map<AIActionType, number>();
    recentActions.forEach(action => {
      const type = action.actionType as AIActionType;
      actionTypeCounts.set(type, (actionTypeCounts.get(type) || 0) + 1);
    });

    const suggestions: SmartSuggestion[] = [];

    // Si beaucoup d'emails triés manuellement
    if ((actionTypeCounts.get('EMAIL_TRIAGE' as AIActionType) || 0) > 20) {
      suggestions.push({
        id: 'auto-email-triage',
        title: 'Activer le triage automatique d\'emails',
        description: `${actionTypeCounts.get('EMAIL_TRIAGE' as AIActionType)} emails triés manuellement ce mois`,
        actionType: 'EMAIL_TRIAGE' as AIActionType,
        priority: 'LOW',
        reasoning: 'Volume élevé de triage manuel. L\'automatisation pourrait économiser du temps.',
        suggestedAction: {
          type: 'ENABLE_AUTO_TRIAGE',
          data: { actionType: 'EMAIL_TRIAGE' }
        },
        confidence: 0.79,
        estimatedTimeMinutes: 30
      });
    }

    return suggestions;
  }

  /**
   * Détecter les anomalies
   */
  private async detectAnomalies(tenantId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 1. Dossiers avec délai anormalement long
    const oldDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: 'EN_COURS',
        createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 jours
      },
      take: 3
    });

    oldDossiers.forEach((dossier: { id: string; numero: string; createdAt: Date }) => {
      suggestions.push({
        id: `anomaly-old-${dossier.id}`,
        title: `Dossier anormalement long: ${dossier.numero}`,
        description: `Dossier ouvert depuis ${Math.floor((Date.now() - dossier.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours`,
        actionType: 'GENERATE_DRAFT' as AIActionType,
        priority: 'HIGH',
        reasoning: 'Délai anormalement long. Vérification recommandée.',
        suggestedAction: {
          type: 'REVIEW_DOSSIER',
          data: { dossierId: dossier.id }
        },
        confidence: 0.85,
        estimatedTimeMinutes: 10
      });
    });

    // 2. Factures impayées depuis longtemps
    const overdueInvoices = await prisma.facture.findMany({
      where: {
        tenantId,
        statut: 'EN_ATTENTE',
        dateEcheance: { lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } // 60 jours
      },
      take: 3
    });

    overdueInvoices.forEach((facture: { id: string; numero: string; dateEcheance: Date | null }) => {
      const daysPastDue = facture.dateEcheance 
        ? Math.floor((Date.now() - facture.dateEcheance.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      suggestions.push({
        id: `anomaly-invoice-${facture.id}`,
        title: `Facture impayée: ${facture.numero}`,
        description: `Facture en retard de ${daysPastDue} jours`,
        actionType: 'GENERATE_DRAFT' as AIActionType,
        priority: 'CRITICAL',
        reasoning: 'Facture en retard significatif. Action urgente requise.',
        suggestedAction: {
          type: 'SEND_PAYMENT_REMINDER',
          data: { factureId: facture.id }
        },
        confidence: 0.92,
        estimatedTimeMinutes: 5
      });
    });

    return suggestions;
  }

  /**
   * Marquer une suggestion comme appliquée
   */
  async markSuggestionApplied(suggestionId: string, tenantId: string): Promise<void> {
    // Log l'application de la suggestion pour l'apprentissage
    await prisma.aIAction.create({
      data: {
        tenantId,
        actionType: 'SUGGESTION_APPLIED',
        autonomyLevel: 'GREEN',
        confidence: 1.0,
        requiresValidation: false,
        validationLevel: 'NONE',
        content: JSON.stringify({ applied: true }),
        rationale: 'Suggestion acceptée par utilisateur',
        metadata: JSON.stringify({ suggestionId })
      }
    });
  }

  /**
   * Obtenir les statistiques des suggestions
   */
  async getSuggestionStats(tenantId: string): Promise<{
    totalGenerated: number;
    totalApplied: number;
    averageConfidence: number;
    topActionTypes: Array<{ type: string; count: number }>;
  }> {
    const appliedSuggestions = await prisma.aIAction.count({
      where: {
        tenantId,
        actionType: 'SUGGESTION_APPLIED'
      }
    });

    // Simuler les stats pour l'exemple
    return {
      totalGenerated: 42,
      totalApplied: appliedSuggestions,
      averageConfidence: 0.84,
      topActionTypes: [
        { type: 'GENERATE_DRAFT', count: 15 },
        { type: 'EMAIL_TRIAGE', count: 12 },
        { type: 'GENERATE_FORM', count: 8 }
      ]
    };
  }
}

// Singleton
let suggestionServiceInstance: SuggestionService | null = null;

export function getSuggestionService(): SuggestionService {
  if (!suggestionServiceInstance) {
    suggestionServiceInstance = new SuggestionService();
  }  return suggestionServiceInstance;
}


