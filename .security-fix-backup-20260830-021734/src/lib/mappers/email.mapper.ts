/**
 * Email mapper — Raw email ↔ Draft ↔ API
 * Follows contract-adapter pattern (.amazonq/rules/contract-adapter-pattern.md)
 */

import type { Event, IngestEmailRequest } from '@/lib/api-types'
import type { LegalCaseDraft } from '@/types/draft.types'

/**
 * Prisma Event (email) → API Event
 */
export function mapEmailFromDB(db: Record<string, unknown>): Event {
  return {
    id: db.id as string,
    type: (db.type as string) || 'email',
    fromEmail: (db.fromEmail as string) || undefined,
    toEmail: (db.toEmail as string) || undefined,
    subject: (db.subject as string) || undefined,
    body: (db.body as string) || undefined,
    occurredAt: (db.occurredAt as Date)?.toISOString?.() || String(db.occurredAt),
    checksum: (db.checksum as string) || undefined,
    requiresAttention: (db.requiresAttention as boolean) || false,
    sourceId: (db.sourceId as string) || '',
  }
}

/**
 * Raw email input → IngestEmailRequest (API contract)
 */
export function mapRawEmailToIngest(raw: {
  messageId?: string
  from: string
  subject: string
  body: string
  date?: Date | string
}): IngestEmailRequest {
  return {
    externalId: raw.messageId || `email-${Date.now()}`,
    from: raw.from,
    subject: raw.subject,
    body: raw.body,
    occurredAt: raw.date
      ? new Date(raw.date as string).toISOString()
      : new Date().toISOString(),
  }
}

/**
 * LegalCaseDraft → partial CreateCaseRequest
 * Draft fields are optional — human validation fills the gaps
 */
export function mapDraftToCreateCase(draft: LegalCaseDraft): Record<string, unknown> {
  return {
    title: draft.subject || `${draft.caseType || 'Nouveau dossier'} - ${draft.clientName || 'Client inconnu'}`,
    clientName: draft.clientName,
    clientEmail: draft.clientEmail,
    clientPhone: draft.clientPhone,
    tags: [draft.caseType, draft.caseSubType].filter(Boolean) as string[],
    priority: mapUrgencyToNumber(draft.urgency),
  }
}

function mapUrgencyToNumber(urgency?: string): number {
  switch (urgency) {
    case 'critical': return 4
    case 'high': return 3
    case 'medium': return 2
    case 'low': return 1
    default: return 2
  }
}
