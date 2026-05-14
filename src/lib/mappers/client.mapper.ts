/**
 * Client mapper — DB ↔ API ↔ UI
 * Follows contract-adapter pattern (.amazonq/rules/contract-adapter-pattern.md)
 */

import type { Client } from '@/lib/api-types'
import type { ClientInput, ClientListItem } from '@/types/client.types'
import { formatNomComplet } from '@/types/client.types'

/**
 * Prisma Client → API Client
 */
export function mapClientFromDB(db: Record<string, unknown>): Client {
  return {
    id: db.id as string,
    name: [db.firstName, db.lastName].filter(Boolean).join(' '),
    email: (db.email as string) || undefined,
    phone: (db.telephone as string) || undefined,
    address: (db.address as string) || undefined,
    notes: (db.notes as string) || undefined,
    userId: (db.userId as string) || (db.tenantId as string) || '',
    createdAt: (db.createdAt as Date)?.toISOString?.() || String(db.createdAt),
  }
}

/**
 * Prisma Client → UI ClientListItem
 */
export function mapClientToListItem(db: Record<string, unknown>): ClientListItem {
  const firstName = (db.firstName as string) || ''
  const lastName = (db.lastName as string) || ''

  return {
    id: db.id as string,
    firstName,
    lastName,
    nomComplet: formatNomComplet({ firstName, lastName }),
    email: (db.email as string) || '',
    telephone: (db.telephone as string) || undefined,
    status: (db.status as ClientListItem['status']) || 'actif',
    nombreDossiers: (db._count as Record<string, number>)?.dossiers ?? 0,
    dossiersActifs: 0,
    tags: (db.tags as string[]) || undefined,
  }
}

/**
 * UI ClientInput → Prisma create data
 */
export function mapClientInputToDB(input: ClientInput): Record<string, unknown> {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    telephone: input.telephone,
    address: input.address,
    codePostal: input.codePostal,
    ville: input.ville,
    pays: input.pays,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth as string) : undefined,
    nationality: input.nationality,
    notes: input.notes,
    tags: input.tags,
    status: input.status || 'actif',
    consentementRGPD: input.consentementRGPD,
  }
}
