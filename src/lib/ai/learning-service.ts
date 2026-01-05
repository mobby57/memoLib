import { prisma } from '@/lib/prisma'

export interface ValidationResult {
  actionId: string
  result: 'APPROVED' | 'REJECTED' | 'MODIFIED_APPROVED'
  confidence: number
  actionType: string
}

export class LearningService {
  // Enregistrer une validation et ajuster la confiance
  static async recordValidation(validation: ValidationResult) {
    // Mettre à jour l'action
    await prisma.aIAction.update({
      where: { id: validation.actionId },
      data: {
        validationStatus: validation.result,
        validatedAt: new Date()
      }
    })

    // Calculer nouvel ajustement de confiance
    const adjustment = this.calculateConfidenceAdjustment(validation)
    
    // Enregistrer les métriques
    await this.updateMetrics(validation, adjustment)
    
    return adjustment
  }

  // Calculer ajustement de confiance basé sur le résultat
  static calculateConfidenceAdjustment(validation: ValidationResult): number {
    switch (validation.result) {
      case 'APPROVED':
        return validation.confidence > 0.9 ? 0.05 : 0.02
      case 'MODIFIED_APPROVED':
        return -0.01
      case 'REJECTED':
        return validation.confidence > 0.7 ? -0.1 : -0.05
      default:
        return 0
    }
  }

  // Analyser les patterns de validation pour un tenant
  static async analyzeValidationPatterns(tenantId: string, days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const actions = await prisma.aIAction.findMany({
      where: {
        tenantId,
        createdAt: { gte: since },
        validationStatus: { not: 'PENDING' }
      }
    })

    const byType = actions.reduce((acc, action) => {
      if (!acc[action.actionType]) {
        acc[action.actionType] = {
          total: 0,
          approved: 0,
          rejected: 0,
          modified: 0,
          avgConfidence: 0
        }
      }
      
      acc[action.actionType].total++
      acc[action.actionType].avgConfidence += action.confidence
      
      switch (action.validationStatus) {
        case 'APPROVED':
        case 'AUTO_APPROVED':
          acc[action.actionType].approved++
          break
        case 'REJECTED':
          acc[action.actionType].rejected++
          break
        case 'MODIFIED_APPROVED':
          acc[action.actionType].modified++
          break
      }
      
      return acc
    }, {} as Record<string, any>)

    // Calculer moyennes et taux de succès
    Object.keys(byType).forEach(type => {
      const stats = byType[type]
      stats.avgConfidence = stats.avgConfidence / stats.total
      stats.successRate = (stats.approved + stats.modified) / stats.total
      stats.recommendation = this.getRecommendation(stats.successRate, stats.avgConfidence)
    })

    return byType
  }

  // Obtenir recommandation basée sur performance
  static getRecommendation(successRate: number, avgConfidence: number): string {
    if (successRate > 0.9 && avgConfidence > 0.8) {
      return 'AUTO_APPROVE'
    } else if (successRate > 0.7 && avgConfidence > 0.6) {
      return 'VALIDATION'
    } else {
      return 'HIGH_RISK'
    }
  }

  // Mettre à jour les métriques d'apprentissage
  static async updateMetrics(validation: ValidationResult, adjustment: number) {
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM
    const periodStart = new Date(period + '-01')
    const periodEnd = new Date(periodStart)
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    
    // Create a simple tracking in actionsByType JSON
    const actionData = JSON.stringify({
      [validation.actionType]: 1,
      approved: validation.result === 'APPROVED' ? 1 : 0,
      rejected: validation.result === 'REJECTED' ? 1 : 0
    })
    
    await prisma.aIMetrics.upsert({
      where: {
        tenantId_period_periodStart: {
          tenantId: 'system',
          period: 'monthly',
          periodStart
        }
      },
      update: {
        avgConfidence: validation.confidence,
        actionsByType: actionData
      },
      create: {
        tenantId: 'system',
        period: 'monthly',
        periodStart,
        periodEnd,
        draftRejectionRate: validation.result === 'REJECTED' ? 1 : 0,
        classificationErrorRate: 0,
        avgValidationTime: 0,
        untreatedEscalations: 0,
        actionsByType: actionData,
        avgConfidence: validation.confidence
      }
    })
  }

  // Prédire le niveau d'approbation pour une nouvelle action
  static async predictApprovalLevel(tenantId: string, actionType: string, confidence: number) {
    const patterns = await this.analyzeValidationPatterns(tenantId)
    const typeStats = patterns[actionType]
    
    if (!typeStats) {
      return confidence > 0.8 ? 'VALIDATION' : 'HIGH_RISK'
    }
    
    return typeStats.recommendation
  }

  // Générer rapport d'amélioration
  static async generateImprovementReport(tenantId: string) {
    const [current, previous] = await Promise.all([
      this.analyzeValidationPatterns(tenantId, 30),
      this.analyzeValidationPatterns(tenantId, 60) // 30-60 jours précédents
    ])

    const improvements = Object.keys(current).map(type => {
      const curr = current[type]
      const prev = previous[type]
      
      if (!prev) return null
      
      const successImprovement = curr.successRate - prev.successRate
      const confidenceImprovement = curr.avgConfidence - prev.avgConfidence
      
      return {
        actionType: type,
        successImprovement: Math.round(successImprovement * 100),
        confidenceImprovement: Math.round(confidenceImprovement * 100),
        currentSuccessRate: Math.round(curr.successRate * 100),
        recommendation: curr.recommendation
      }
    }).filter(Boolean)

    return improvements
  }
}