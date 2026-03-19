import { prisma } from '@/lib/prisma'

export type TypeDossier = 'OQTF' | 'ASILE' | 'TITRE_SEJOUR' | 'NATURALISATION' | 'VISA'
export type Priorite = 'CRITIQUE' | 'HAUTE' | 'NORMALE'
export type StatutDossier = 'EN_COURS' | 'EN_ATTENTE' | 'URGENT' | 'CLOS'

export interface CreateDossierData {
  type: string
  titre: string
  description?: string
  clientId: string
  adminId?: string
  echeance?: Date
  articleCESEDA?: string
  priorite?: Priorite
}

export class CesedaService {
  // Creer un nouveau dossier
  static async createDossier(tenantId: string, data: CreateDossierData) {
    const numero = await this.generateNumero(tenantId)
    const priorite = data.priorite ?? this.calculatePriorite(data.type, data.echeance)

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
        priorite
      },
      include: {
        client: true,
        tenant: true
      }
    })
  }

  // Generer numero de dossier unique
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

  // Calculer priorite automatique selon type et echeance
  static calculatePriorite(type: string, echeance?: Date): Priorite {
    if (!echeance) return 'NORMALE'

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntilDeadline = Math.ceil((echeance.getTime() - now.getTime()) / msPerDay)

    switch (type) {
      case 'OQTF':
        if (daysUntilDeadline <= 7) return 'CRITIQUE'
        if (daysUntilDeadline <= 15) return 'HAUTE'
        return 'NORMALE'

      case 'ASILE':
        if (daysUntilDeadline <= 15) return 'CRITIQUE'
        if (daysUntilDeadline <= 30) return 'HAUTE'
        return 'NORMALE'

      default:
        if (daysUntilDeadline <= 30) return 'HAUTE'
        return 'NORMALE'
    }
  }

  // Mettre a jour statut dossier
  static async updateStatut(dossierId: string, statut: StatutDossier, userId?: string) {
    return prisma.dossier.update({
      where: { id: dossierId },
      data: {
        statut,
        ...(userId && { updatedBy: userId }),
        updatedAt: new Date()
      }
    })
  }

  // Obtenir dossiers urgents pour un tenant
  static async getDossiersUrgents(tenantId: string) {
    return prisma.dossier.findMany({
      where: {
        tenantId,
        statut: { in: ['EN_COURS', 'URGENT'] satisfies StatutDossier[] },
        priorite: { in: ['CRITIQUE', 'HAUTE'] satisfies Priorite[] }
      },
      include: { client: true },
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
          priorite: { in: ['CRITIQUE', 'HAUTE'] satisfies Priorite[] }
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

  // Verifier echeances et mettre a jour priorites
  static async updatePriorites(tenantId: string) {
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
        statut: { in: ['EN_COURS', 'EN_ATTENTE'] satisfies StatutDossier[] },
        dateEcheance: { not: null }
      }
    })

    const updates = dossiers
      .map(dossier => {
        const nouvellePriorite = this.calculatePriorite(dossier.typeDossier, dossier.dateEcheance!)
        if (nouvellePriorite !== dossier.priorite) {
          return prisma.dossier.update({
            where: { id: dossier.id },
            data: { priorite: nouvellePriorite }
          })
        }
        return null
      })
      .filter((u): u is NonNullable<typeof u> => u !== null)

    return Promise.all(updates)
  }

  // Rechercher dossiers avec filtres
  static async searchDossiers(tenantId: string, filters: {
    type?: string
    statut?: StatutDossier
    priorite?: Priorite
    clientId?: string
    search?: string
  }) {
    const where: Record<string, unknown> = { tenantId }

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
