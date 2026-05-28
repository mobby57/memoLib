/**
 * Service de Suggestions Intelligentes
 * Propose des actions contextuelles basees sur l'historique et les patterns
 * 
 * Innovation: L'IA devient proactive et suggere des actions pertinentes
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
   * Genere des suggestions intelligentes pour un tenant
   */
  async generateSuggestions(tenantId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 1. Analyser les dossiers sans mise e jour recente
    const staleDossiers = await this.findStaleDossiers(tenantId);
    suggestions.push(...staleDossiers);

    // 2. Detecter les documents manquants recurrents
    const missingDocs = await this.findRecurringMissingDocuments(tenantId);
    suggestions.push(...missingDocs);

    // 3. Suggerer des relances clients
    const clientFollowups = await this.suggestClientFollowups(tenantId);
    suggestions.push(...clientFollowups);

    // 4. Identifier les opportunites d'automatisation
    const automationOpps = await this.findAutomationOpportunities(tenantId);
    suggestions.push(...automationOpps);

    // 5. Detecter les anomalies et incoherences
    const anomalies = await this.detectAnomalies(tenantId);
    suggestions.push(...anomalies);

    // Trier par priorite
    const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return suggestions.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }

  /**
   * Dossiers sans activite recente
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
      title: `Dossier sans activite: ${dossier.numero}`,
      description: `Le dossier ${dossier.numero} n'a pas ete mis e jour depuis ${Math.floor((Date.now() - dossier.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} jours`,
      actionType: 'GENERATE_DRAFT' as AIActionType,
      priority: 'MEDIUM',
      reasoning: 'Dossier inactif detecte. Une relance client pourrait etre necessaire.',
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
   * Documents manquants recurrents
   */
  private async findRecurringMissingDocuments(tenantId: string): Promise<SmartSuggestion[]> {
    // Analyser les actions passees pour trouver les documents souvent demandes
    const documentRequests = await prisma.aIAction.findMany({
      where: {
        tenantId,
        actionType: 'GENERATE_DRAFT'
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    // Compter les documents les plus demandes
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

    // Creer des suggestions pour les documents frequents
    const suggestions: SmartSuggestion[] = [];
    const threshold = 3; // Au moins 3 occurrences

    for (const [doc, count] of documentCounts) {
      if (count >= threshold) {
        suggestions.push({
          id: `recurring-doc-${doc.replace(/\s+/g, '-')}`,
          title: `Document frequemment manquant: ${doc}`,
          description: `Le document "${doc}" a ete demande ${count} fois recemment`,
          actionType: 'GENERATE_FORM' as AIActionType,
          priority: 'LOW',
          reasoning: 'Creer un formulaire de collecte automatique pourrait reduire les demandes manuelles.',
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
   * Suggerer des relances clients
   */
  private async suggestClientFollowups(tenantId: string): Promise<SmartSuggestion[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Trouver les dossiers avec echeance proche
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
        description: `echeance dans ${daysUntilDeadline} jours pour le dossier ${dossier.numero}`,
        actionType: 'GENERATE_DRAFT' as AIActionType,
        priority: daysUntilDeadline <= 7 ? 'HIGH' : 'MEDIUM',
        reasoning: `echeance proche (${daysUntilDeadline}j). Relance recommandee.`,
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
   * Identifier les opportunites d'automatisation
   */
  private async findAutomationOpportunities(tenantId: string): Promise<SmartSuggestion[]> {
    // Analyser les actions manuelles repetitives
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

    // Si beaucoup d'emails tries manuellement
    if ((actionTypeCounts.get('EMAIL_TRIAGE' as AIActionType) || 0) > 20) {
      suggestions.push({
        id: 'auto-email-triage',
        title: 'Activer le triage automatique d\'emails',
        description: `${actionTypeCounts.get('EMAIL_TRIAGE' as AIActionType)} emails tries manuellement ce mois`,
        actionType: 'EMAIL_TRIAGE' as AIActionType,
        priority: 'LOW',
        reasoning: 'Volume eleve de triage manuel. L\'automatisation pourrait economiser du temps.',
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
   * Detecter les anomalies
   */
  private async detectAnomalies(tenantId: string): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // 1. Dossiers avec delai anormalement long
    const oldDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: 'EN_COURS',
        createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 90 jours
      },
      take: 3
    });

    oldDossiers.forEach((dossier: { id: string; numero: string; createdAt: Date }) => {
      const daysOld = Math.floor(
        (Date.now() - dossier.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      suggestions.push({
        id: `anomaly-old-${dossier.id}`,
        title: `?? Dossier anormalement ancien: ${dossier.numero}`,
        description: `Dossier en cours depuis ${daysOld} jours sans cleture`,
        actionType: 'DETECT_ALERT' as AIActionType,
        priority: 'HIGH',
        reasoning: 'Duree de traitement inhabituelle. Verification recommandee.',
        suggestedAction: {
          type: 'REVIEW_CASE_STATUS',
          data: { dossierId: dossier.id, daysOld }
        },
        confidence: 0.91,
        estimatedTimeMinutes: 10
      });
    });

    // 2. Factures impayees depuis longtemps
    const oldInvoices = await prisma.facture.findMany({
      where: {
        tenantId,
        statut: 'IMPAYEE',
        dateEmission: { lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } // 60 jours
      },
      take: 3
    });

    oldInvoices.forEach((facture: { id: string; numero: string; montant: number; dateEmission: Date }) => {
      const daysOverdue = Math.floor(
        (Date.now() - facture.dateEmission.getTime()) / (1000 * 60 * 60 * 24)
      );

      suggestions.push({
        id: `anomaly-invoice-${facture.id}`,
        title: `?? Facture impayee: ${facture.numero}`,
        description: `Facture de ${facture.montant}e impayee depuis ${daysOverdue} jours`,
        actionType: 'GENERATE_DRAFT' as AIActionType,
        priority: 'CRITICAL',
        reasoning: 'Retard de paiement significatif. Action de recouvrement necessaire.',
        suggestedAction: {
          type: 'SEND_PAYMENT_REMINDER',
          data: { 
            factureId: facture.id, 
            amount: facture.montant,
            daysOverdue 
          }
        },
        confidence: 0.94,
        estimatedTimeMinutes: 5
      });
    });

    return suggestions;
  }

  /**
   * Accepter une suggestion et creer l'action correspondante
   */
  async acceptSuggestion(
    tenantId: string,
    suggestionId: string,
    userId: string
  ): Promise<{ success: boolean; actionId?: string; error?: string }> {
    try {
      // Dans une vraie implementation, on executerait l'action suggeree
      // Pour l'instant, on log juste l'acceptation
      const metadataStr = JSON.stringify({
        suggestionId,
        acceptedAt: new Date()
      });
      
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'ACCEPT_SUGGESTION',
          objectType: 'Suggestion',
          objectId: suggestionId,
          metadata: metadataStr,
          hash: require('crypto').createHash('sha256').update(metadataStr + suggestionId + Date.now()).digest('hex'),
          success: true
        }
      });

      return { success: true, actionId: suggestionId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }
}

// Singleton
let suggestionServiceInstance: SuggestionService | null = null;

export function getSuggestionService(): SuggestionService {
  if (!suggestionServiceInstance) {
    suggestionServiceInstance = new SuggestionService();
  }
  return suggestionServiceInstance;
}
