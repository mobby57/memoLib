/**
 * Draft mapper — Draft + ValidateDraftPayload → Dossier creation data
 * Follows contract-adapter pattern (.amazonq/rules/contract-adapter-pattern.md)
 */

import type { LegalCaseDraft, ValidateDraftPayload } from '@/types/draft.types'

/**
 * Map a validated draft + human input into dossier creation data.
 * Called after human validation of the draft.
 */
export function mapValidatedDraftToDossier(
  extractedData: LegalCaseDraft,
  payload: ValidateDraftPayload,
  clientId: string
): {
  clientId: string
  typeDossier: string
  objetDemande: string
  priorite: string
  notes?: string
  dateEcheance?: string
} {
  return {
    clientId,
    typeDossier: payload.caseType,
    objetDemande: extractedData.subject || `${payload.caseType} - ${payload.clientName}`,
    priorite: mapUrgencyToPriorite(payload.urgency),
    notes: [
      payload.notes,
      extractedData.summary,
      extractedData.rawContent ? `[Source email]\n${extractedData.rawContent.slice(0, 500)}` : null,
    ]
      .filter(Boolean)
      .join('\n\n') || undefined,
    dateEcheance: payload.notificationDate || extractedData.deadline || undefined,
  }
}

function mapUrgencyToPriorite(urgency?: string): string {
  switch (urgency) {
    case 'critical': return 'critique'
    case 'high': return 'haute'
    case 'medium': return 'normale'
    case 'low': return 'basse'
    default: return 'normale'
  }
}
