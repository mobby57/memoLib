import { prisma } from '@/lib/prisma'

export interface CreateDossierData {
  type: string
  titre: string
  description?: string
  clientId: string
  adminId?: string
  echeance?: Date
  articleCESEDA?: string
  priorite?: string
}

export class CesedaService {
  // Créer un nouveau dossier
  static async createDossier(tenantId: string, data: CreateDossierData) {
    const numero = await this.generateNumero(tenantId)
    
    return prisma.dossier.create({
      data: {
        numero,
        tenantId,
        clientId: data.clientId,
        typeDossier: data.type,
        objet: data.titre,
        description: data.description,
        dateEcheance: data.echeance,
        articleCeseda: data.articleCESEDA,
        priorite: data.priorite || 'normale'
      },
      include: {
        client: true,
        tenant: true
      }
    })
  }

  // Générer numéro de dossier unique
  static async generateNumero(tenantId: string): Promise<string> {
    const year = new Date().getFullYear()
    const count = await prisma.dossier.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    
    return `D-${year}-${String(count + 1).padStart(3, '0')}`
  }

  // Calculer priorité automatique selon type et échéance
  static calculatePriorite(type: string, echeance?: Date): string {
    if (!echeance) return 'normale'
    
    const now = new Date()
    const daysUntilDeadline = Math.ceil((echeance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    // Règles spécifiques CESEDA
    switch (type) {
      case 'OQTF':
        if (daysUntilDeadline <= 7) return 'critique'
        if (daysUntilDeadline <= 15) return 'haute'
        return 'normale'
      
      case 'ASILE':
        if (daysUntilDeadline <= 15) return 'critique'
        if (daysUntilDeadline <= 30) return 'haute'
        return 'normale'
      
      default:
        if (daysUntilDeadline <= 30) return 'haute'
        return 'normale'
    }
  }

  // Mettre à jour statut dossier
  static async updateStatut(dossierId: string, statut: string, userId?: string) {
    return prisma.dossier.update({
      where: { id: dossierId },
      data: {
        statut,
        updatedAt: new Date()
      }
    })
  }

  // Obtenir dossiers urgents pour un tenant
  static async getDossiersUrgents(tenantId: string) {
    return prisma.dossier.findMany({
      where: {
        tenantId,
        statut: {
          in: ['EN_COURS', 'URGENT']
        },
        priorite: {
          in: ['CRITIQUE', 'HAUTE']
        }
      },
      include: {
        client: true
      },
      orderBy: [
        { priorite: 'desc' },
        { dateEcheance: 'asc' }
      ]
    })
  }

  // Obtenir statistiques dossiers pour dashboard
  static async getStats(tenantId: string) {
    const [total, urgents, parType, parStatut] = await Promise.all([
      prisma.dossier.count({ where: { tenantId } }),
      prisma.dossier.count({
        where: {
          tenantId,
          priorite: { in: ['CRITIQUE', 'HAUTE'] }
        }
      }),
      prisma.dossier.groupBy({
        by: ['typeDossier'],
        where: { tenantId },
        _count: true
      }),
      prisma.dossier.groupBy({
        by: ['statut'],
        where: { tenantId },
        _count: true
      })
    ])

    return {
      totalDossiers: total,
      dossiersUrgents: urgents,
      repartitionType: parType,
      repartitionStatut: parStatut
    }
  }

  // Vérifier échéances et mettre à jour priorités
  static async updatePriorites(tenantId: string) {
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: { in: ['EN_COURS', 'EN_ATTENTE'] },
        dateEcheance: { not: null }
      }
    })

    const updates = dossiers.map(dossier => {
      const nouvellePriorite = this.calculatePriorite(dossier.typeDossier, dossier.dateEcheance!)
      
      if (nouvellePriorite !== dossier.priorite) {
        return prisma.dossier.update({
          where: { id: dossier.id },
          data: { priorite: nouvellePriorite }
        })
      }
      return null
    }).filter(Boolean)

    return Promise.all(updates.filter(Boolean) as Promise<any>[])
  }

  // Rechercher dossiers avec filtres
  static async searchDossiers(tenantId: string, filters: {
    type?: string
    statut?: string
    priorite?: string
    clientId?: string
    search?: string
  }) {
    const where: any = { tenantId }

    if (filters.type) where.typeDossier = filters.type
    if (filters.statut) where.statut = filters.statut
    if (filters.priorite) where.priorite = filters.priorite
    if (filters.clientId) where.clientId = filters.clientId
    
    if (filters.search) {
      where.OR = [
        { numero: { contains: filters.search } },
        { objet: { contains: filters.search } },
        { description: { contains: filters.search } }
      ]
    }

    return prisma.dossier.findMany({
      where,
      include: {
        client: true,
        factures: true,
        documents: true
      },
      orderBy: [
        { priorite: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }
}