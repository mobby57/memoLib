/**
 * Facture mapper — DB ↔ API ↔ UI
 * Follows contract-adapter pattern (.amazonq/rules/contract-adapter-pattern.md)
 */

import type { Facture, FactureLigne, CreateFactureRequest } from '@/lib/api-types'

/**
 * Prisma Facture → API Facture
 */
export function mapFactureFromDB(db: Record<string, unknown>): Facture {
  const lignes = (db.lignes as FactureLigne[]) || []
  const montantHT = lignes.reduce((sum, l) => sum + l.prixUnitaireHT * l.quantite, 0)
  const montantTTC = lignes.reduce(
    (sum, l) => sum + l.prixUnitaireHT * l.quantite * (1 + l.tva / 100),
    0
  )

  return {
    id: db.id as string,
    numero: (db.numero as string) || '',
    clientId: db.clientId as string,
    dossierId: (db.dossierId as string) || undefined,
    statut: (db.statut as Facture['statut']) || 'BROUILLON',
    dateEmission: (db.dateEmission as Date)?.toISOString?.() || String(db.dateEmission),
    dateEcheance: (db.dateEcheance as Date)?.toISOString?.() || String(db.dateEcheance),
    montantHT: Math.round(montantHT * 100) / 100,
    montantTTC: Math.round(montantTTC * 100) / 100,
    lignes,
    createdAt: (db.createdAt as Date)?.toISOString?.() || String(db.createdAt),
  }
}

/**
 * UI form → CreateFactureRequest (API contract)
 */
export function mapFactureFormToAPI(form: {
  clientId: string
  dossierId?: string
  dateEcheance: string
  lignes: Array<{
    description: string
    quantite: number
    prixUnitaireHT: number
    tva?: number
  }>
  notes?: string
}): CreateFactureRequest {
  return {
    clientId: form.clientId,
    dossierId: form.dossierId,
    dateEcheance: form.dateEcheance,
    lignes: form.lignes.map(l => ({
      description: l.description,
      quantite: l.quantite,
      prixUnitaireHT: l.prixUnitaireHT,
      tva: l.tva ?? 20,
    })),
    notes: form.notes,
  }
}

/**
 * Generate invoice number: F-YYYY-NNNN
 */
export function generateNumeroFacture(count: number): string {
  const year = new Date().getFullYear()
  return `F-${year}-${String(count + 1).padStart(4, '0')}`
}
