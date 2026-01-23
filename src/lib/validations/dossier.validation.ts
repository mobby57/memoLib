/**
 * Schémas de validation Zod centralisés
 * Utilisés côté client ET serveur
 */

import { z } from 'zod'
import { TYPES_DOSSIER, PRIORITES_UI, STATUTS_UI } from '../constants/dossier.constants'

// Schéma de base pour un dossier
export const dossierBaseSchema = z.object({
  typeDossier: z.enum([
    TYPES_DOSSIER.TITRE_SEJOUR,
    TYPES_DOSSIER.RECOURS_OQTF,
    TYPES_DOSSIER.NATURALISATION,
    TYPES_DOSSIER.REGROUPEMENT_FAMILIAL,
    TYPES_DOSSIER.ASILE,
    TYPES_DOSSIER.VISA,
    TYPES_DOSSIER.AUTRE,
  ] as const),
  objetDemande: z.string().min(10, 'Minimum 10 caractères').max(500, 'Maximum 500 caractères'),
  priorite: z.enum([
    PRIORITES_UI.NORMALE,
    PRIORITES_UI.HAUTE,
    PRIORITES_UI.URGENTE,
    PRIORITES_UI.CRITIQUE,
  ] as const).default(PRIORITES_UI.NORMALE),
  dateEcheance: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().max(2000, 'Maximum 2000 caractères').optional(),
})

// Schéma pour création par avocat
export const createDossierSchema = dossierBaseSchema.extend({
  clientId: z.string().uuid('ID client invalide'),
  statut: z.enum([
    STATUTS_UI.BROUILLON,
    STATUTS_UI.EN_COURS,
    STATUTS_UI.EN_ATTENTE,
    STATUTS_UI.URGENT,
  ] as const).optional(),
})

// Schéma pour création par client (simplifié)
export const createDemandeClientSchema = z.object({
  typeDossier: z.enum([
    TYPES_DOSSIER.TITRE_SEJOUR,
    TYPES_DOSSIER.RECOURS_OQTF,
    TYPES_DOSSIER.NATURALISATION,
    TYPES_DOSSIER.REGROUPEMENT_FAMILIAL,
    TYPES_DOSSIER.ASILE,
    TYPES_DOSSIER.VISA,
    TYPES_DOSSIER.AUTRE,
  ] as const),
  objetDemande: z.string().min(20, 'Décrivez votre demande en minimum 20 caractères').max(500),
  dateEcheance: z.string().datetime().optional().or(z.literal('')),
  urgence: z.boolean().optional(),
  complementInfo: z.string().max(1000).optional(),
})

// Schéma pour mise à jour
export const updateDossierSchema = dossierBaseSchema.partial().extend({
  statut: z.enum([
    STATUTS_UI.BROUILLON,
    STATUTS_UI.EN_COURS,
    STATUTS_UI.EN_ATTENTE,
    STATUTS_UI.URGENT,
    STATUTS_UI.TERMINE,
    STATUTS_UI.REJETE,
    STATUTS_UI.ANNULE,
  ] as const).optional(),
})

// Types TypeScript générés depuis Zod
export type CreateDossierInput = z.infer<typeof createDossierSchema>
export type CreateDemandeClientInput = z.infer<typeof createDemandeClientSchema>
export type UpdateDossierInput = z.infer<typeof updateDossierSchema>

// Validation helper
export function validateDossierData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true, data: T } | { success: false, errors: z.ZodError } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error }
    }
    throw error
  }
}
