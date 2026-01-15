/**
 * Mappers pour convertir les données entre DB et UI
 * Centralise toute la logique de transformation
 */

import type { DossierDB, DossierUI } from '@/types/dossier.types'
import { mapStatutToUI, mapPrioriteToUI, TYPE_LABELS } from '../constants/dossier.constants'

/**
 * Convertit un dossier DB en format UI
 */
export function mapDossierToUI(dossier: DossierDB): DossierUI {
  return {
    id: dossier.id,
    numeroDossier: dossier.numero,
    typeDossier: dossier.typeDossier as any,
    objetDemande: dossier.objet || '',
    statut: mapStatutToUI(dossier.statut) as any,
    priorite: mapPrioriteToUI(dossier.priorite) as any,
    dateCreation: dossier.dateCreation,
    dateEcheance: dossier.dateEcheance || undefined,
    client: {
      nom: dossier.client.lastName,
      prenom: dossier.client.firstName,
      email: dossier.client.email,
    },
    _count: dossier._count,
  }
}

/**
 * Convertit un tableau de dossiers DB en format UI
 */
export function mapDossiersToUI(dossiers: DossierDB[]): DossierUI[] {
  return dossiers.map(mapDossierToUI)
}

/**
 * Génère un numéro de dossier unique
 */
export function generateNumeroDossier(count: number): string {
  const year = new Date().getFullYear()
  return `D-${year}-${String(count + 1).padStart(3, '0')}`
}

/**
 * Formatte une date pour l'affichage
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatte une date pour l'input datetime-local
 */
export function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().slice(0, 16)
}

/**
 * Retourne le label lisible d'un type de dossier
 */
export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type
}
