/**
 * Service métier centralisé pour la gestion des dossiers
 * Logique réutilisable par toutes les routes API
 */

import { PrismaClient } from '@prisma/client'
import type { CreateDossierDTO, CreateDemandeClientDTO, DossierDB } from '@/types/dossier.types'
import { mapStatutToDB, mapPrioriteToDB } from '../constants/dossier.constants'
import { generateNumeroDossier } from '../mappers/dossier.mapper'

const prisma = new PrismaClient()

export class DossierService {
  /**
   * Génère un numéro de dossier unique pour un tenant
   */
  static async generateNumeroDossier(tenantId: string): Promise<string> {
    const count = await prisma.dossier.count({
      where: { tenantId },
    })
    return generateNumeroDossier(count)
  }

  /**
   * Crée un nouveau dossier (utilisé par l'avocat)
   */
  static async createDossier(
    data: CreateDossierDTO,
    tenantId: string
  ): Promise<DossierDB> {
    // Vérifier que le client appartient au tenant
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        tenantId,
      },
    })

    if (!client) {
      throw new Error('Client non trouvé ou accès refusé')
    }

    // Générer le numéro
    const numero = await this.generateNumeroDossier(tenantId)

    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        numero,
        typeDossier: data.typeDossier,
        objet: data.objetDemande,
        priorite: mapPrioriteToDB(data.priorite || 'NORMALE'),
        statut: mapStatutToDB(data.statut || 'EN_COURS'),
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        notes: data.notes || '',
        tenantId,
        clientId: data.clientId,
        dateCreation: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossier as any
  }

  /**
   * Crée une demande client (formulaire simplifié)
   */
  static async createDemandeClient(
    data: CreateDemandeClientDTO,
    tenantId: string,
    clientId: string
  ): Promise<DossierDB> {
    // Générer le numéro
    const numero = await this.generateNumeroDossier(tenantId)

    // Déterminer la priorité
    const priorite = data.urgence ? 'haute' : 'normale'

    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        numero,
        typeDossier: data.typeDossier,
        objet: data.objetDemande,
        priorite,
        statut: 'en_cours',
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        notes: data.complementInfo || '',
        tenantId,
        clientId,
        dateCreation: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossier as any
  }

  /**
   * Récupère tous les dossiers d'un tenant
   */
  static async getDossiersByTenant(tenantId: string): Promise<DossierDB[]> {
    const dossiers = await prisma.dossier.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        dateCreation: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossiers as any
  }

  /**
   * Récupère un dossier par ID avec vérification tenant
   */
  static async getDossierById(
    dossierId: string,
    tenantId: string
  ): Promise<DossierDB | null> {
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        tenantId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossier as any
  }

  /**
   * Récupère les dossiers d'un client
   */
  static async getDossiersByClient(clientId: string): Promise<DossierDB[]> {
    const dossiers = await prisma.dossier.findMany({
      where: {
        clientId,
      },
      orderBy: {
        dateCreation: 'desc',
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossiers as any
  }

  /**
   * Met à jour un dossier
   */
  static async updateDossier(
    dossierId: string,
    tenantId: string,
    data: Partial<CreateDossierDTO>
  ): Promise<DossierDB> {
    // Vérifier que le dossier appartient au tenant
    const existing = await this.getDossierById(dossierId, tenantId)
    if (!existing) {
      throw new Error('Dossier non trouvé')
    }

    const updateData: any = {}
    
    if (data.typeDossier) updateData.typeDossier = data.typeDossier
    if (data.objetDemande) updateData.objet = data.objetDemande
    if (data.priorite) updateData.priorite = mapPrioriteToDB(data.priorite)
    if (data.statut) updateData.statut = mapStatutToDB(data.statut)
    if (data.dateEcheance !== undefined) {
      updateData.dateEcheance = data.dateEcheance ? new Date(data.dateEcheance) : null
    }
    if (data.notes !== undefined) updateData.notes = data.notes

    const dossier = await prisma.dossier.update({
      where: { id: dossierId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            echeances: true,
          },
        },
      },
    })

    return dossier as any
  }

  /**
   * Supprime un dossier
   */
  static async deleteDossier(dossierId: string, tenantId: string): Promise<void> {
    // Vérifier que le dossier appartient au tenant
    const existing = await this.getDossierById(dossierId, tenantId)
    if (!existing) {
      throw new Error('Dossier non trouvé')
    }

    await prisma.dossier.delete({
      where: { id: dossierId },
    })
  }

  /**
   * Ferme la connexion Prisma
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect()
  }
}
