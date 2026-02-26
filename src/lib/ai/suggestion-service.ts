import { prisma } from '@/lib/prisma'

export interface Suggestion {
  id: string
  type: string
  title: string
  description: string
  confidence: number
  dossierId?: string
  actionData?: any
}

export class SuggestionService {
  // G�n�rer toutes les suggestions pour un tenant
  static async generateSuggestions(tenantId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []
    
    // 1. Dossiers inactifs
    const inactiveSuggestions = await this.detectInactiveDossiers(tenantId)
    suggestions.push(...inactiveSuggestions)
    
    // 2. Documents manquants r�currents
    const documentSuggestions = await this.detectMissingDocuments(tenantId)
    suggestions.push(...documentSuggestions)
    
    // 3. �ch�ances critiques
    const deadlineSuggestions = await this.detectCriticalDeadlines(tenantId)
    suggestions.push(...deadlineSuggestions)
    
    // 4. Opportunit�s d'automatisation
    const automationSuggestions = await this.detectAutomationOpportunities(tenantId)
    suggestions.push(...automationSuggestions)
    
    // 5. Anomalies
    const anomalySuggestions = await this.detectAnomalies(tenantId)
    suggestions.push(...anomalySuggestions)
    
    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  // D�tecter dossiers inactifs (> 14 jours)
  static async detectInactiveDossiers(tenantId: string): Promise<Suggestion[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 14)
    
    const inactiveDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: 'EN_COURS',
        updatedAt: { lt: cutoffDate }
      },
      include: { client: true }
    })
    
    return inactiveDossiers.map(dossier => ({
      id: `inactive_${dossier.id}`,
      type: 'INACTIVE_DOSSIER',
      title: `Dossier inactif: ${dossier.numero}`,
      description: `Le dossier de ${dossier.client ? `${dossier.client.firstName} ${dossier.client.lastName}` : 'Client'} n'a pas �t� mis � jour depuis ${Math.ceil((Date.now() - dossier.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} jours`,
      confidence: 0.85,
      dossierId: dossier.id,
      actionData: {
        action: 'SEND_REMINDER',
        clientEmail: dossier.client?.email
      }
    }))
  }

  // D�tecter documents manquants r�currents
  static async detectMissingDocuments(tenantId: string): Promise<Suggestion[]> {
    // Analyser les patterns de documents manquants
    const dossiers = await prisma.dossier.findMany({
      where: { tenantId },
      include: { documents: true }
    })
    
    const missingPatterns = new Map<string, number>()
    
    dossiers.forEach(dossier => {
      const requiredDocs = this.getRequiredDocuments(dossier.typeDossier as any)
      const existingTypes = dossier.documents.map(d => d.filename.toLowerCase())
      
      requiredDocs.forEach(required => {
        const hasDoc = existingTypes.some(existing => existing.includes(required.toLowerCase()))
        if (!hasDoc) {
          missingPatterns.set(required, (missingPatterns.get(required) || 0) + 1)
        }
      })
    })
    
    return Array.from(missingPatterns.entries())
      .filter(([_, count]) => count >= 3)
      .map(([docType, count]) => ({
        id: `missing_doc_${docType}`,
        type: 'MISSING_DOCUMENT_PATTERN',
        title: `Document manquant r�current: ${docType}`,
        description: `${count} dossiers n'ont pas de ${docType}. Automatiser la demande?`,
        confidence: Math.min(0.9, count / 10),
        actionData: {
          action: 'AUTOMATE_DOCUMENT_REQUEST',
          documentType: docType
        }
      }))
  }

  // D�tecter �ch�ances critiques
  static async detectCriticalDeadlines(tenantId: string): Promise<Suggestion[]> {
    const in14Days = new Date()
    in14Days.setDate(in14Days.getDate() + 14)
    
    const criticalDossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        dateEcheance: { lte: in14Days },
        statut: { in: ['EN_COURS', 'EN_ATTENTE'] }
      },
      include: { client: true }
    })
    
    return criticalDossiers.map(dossier => {
      const daysLeft = Math.ceil((dossier.dateEcheance!.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      return {
        id: `deadline_${dossier.id}`,
        type: 'CRITICAL_DEADLINE',
        title: `�ch�ance critique: ${dossier.numero}`,
        description: `${daysLeft} jours restants pour ${dossier.client ? `${dossier.client.firstName} ${dossier.client.lastName}` : 'Client'}`,
        confidence: daysLeft <= 7 ? 0.95 : 0.8,
        dossierId: dossier.id,
        actionData: {
          action: 'SEND_URGENT_REMINDER',
          daysLeft
        }
      }
    })
  }

  // D�tecter opportunit�s d'automatisation
  static async detectAutomationOpportunities(tenantId: string): Promise<Suggestion[]> {
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const recentActions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        createdAt: { gte: lastMonth }
      }
    })
    
    const actionCounts = recentActions.reduce((acc, action) => {
      acc[action.actionType] = (acc[action.actionType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return Object.entries(actionCounts)
      .filter(([_, count]) => count > 20)
      .map(([actionType, count]) => ({
        id: `automation_${actionType}`,
        type: 'AUTOMATION_OPPORTUNITY',
        title: `Opportunit� d'automatisation: ${actionType}`,
        description: `${count} actions de ce type le mois dernier. Augmenter l'autonomie?`,
        confidence: Math.min(0.9, count / 50),
        actionData: {
          action: 'INCREASE_AUTONOMY',
          actionType,
          frequency: count
        }
      }))
  }

  // D�tecter anomalies
  static async detectAnomalies(tenantId: string): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = []
    
    // Dossiers tr�s anciens
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 90)
    
    const oldDossiers = await prisma.dossier.count({
      where: {
        tenantId,
        createdAt: { lt: oldDate },
        statut: 'EN_COURS'
      }
    })
    
    if (oldDossiers > 0) {
      suggestions.push({
        id: 'anomaly_old_dossiers',
        type: 'ANOMALY',
        title: `${oldDossiers} dossiers tr�s anciens`,
        description: `Des dossiers sont en cours depuis plus de 90 jours`,
        confidence: 0.7,
        actionData: {
          action: 'REVIEW_OLD_DOSSIERS'
        }
      })
    }
    
    // Factures impay�es anciennes
    const oldInvoiceDate = new Date()
    oldInvoiceDate.setDate(oldInvoiceDate.getDate() - 60)
    
    const oldInvoices = await prisma.facture.count({
      where: {
        tenantId,
        statut: 'EN_ATTENTE',
        createdAt: { lt: oldInvoiceDate }
      }
    })
    
    if (oldInvoices > 0) {
      suggestions.push({
        id: 'anomaly_old_invoices',
        type: 'ANOMALY',
        title: `${oldInvoices} factures impay�es anciennes`,
        description: `Des factures sont impay�es depuis plus de 60 jours`,
        confidence: 0.8,
        actionData: {
          action: 'REVIEW_OLD_INVOICES'
        }
      })
    }
    
    return suggestions
  }

  // Obtenir documents requis par type de dossier
  static getRequiredDocuments(type: string): string[] {
    const requirements = {
      OQTF: ['passeport', 'decision_oqtf', 'justificatif_domicile'],
      ASILE: ['passeport', 'recit_asile', 'pieces_identite'],
      NATURALISATION: ['passeport', 'justificatifs_revenus', 'casier_judiciaire'],
      TITRE_SEJOUR: ['passeport', 'justificatif_domicile', 'contrat_travail'],
      CARTE_RESIDENT: ['titre_sejour', 'justificatifs_revenus', 'attestation_integration']
    }
    
    return requirements[type as keyof typeof requirements] || []
  }

  // Marquer suggestion comme trait�e
  static async markSuggestionAsHandled(suggestionId: string) {
    // Note: Suggestions are generated on-the-fly, not stored in DB
    // This would require adding a Suggestion model to schema if persistence is needed
    return { success: true, id: suggestionId }
  }
}
