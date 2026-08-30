/**
 * Document mapper — DB ↔ API
 * Follows contract-adapter pattern (.amazonq/rules/contract-adapter-pattern.md)
 */

import type { Document, UploadDocumentRequest } from '@/lib/api-types'

/**
 * Prisma Document → API Document
 */
export function mapDocumentFromDB(db: Record<string, unknown>): Document {
  return {
    id: db.id as string,
    title: (db.title as string) || (db.fileName as string) || '',
    fileName: (db.fileName as string) || '',
    contentType: (db.contentType as string) || 'application/octet-stream',
    fileSize: (db.fileSize as number) || 0,
    type: (db.type as Document['type']) || 'AUTRE',
    dossierId: db.dossierId as string,
    uploadedBy: (db.uploadedBy as string) || (db.userId as string) || '',
    tags: (db.tags as string[]) || undefined,
    createdAt: (db.createdAt as Date)?.toISOString?.() || String(db.createdAt),
  }
}

/**
 * UI upload form → UploadDocumentRequest (API contract)
 */
export function mapUploadFormToAPI(form: {
  dossierId: string
  title: string
  type?: string
  description?: string
  tags?: string[]
}): UploadDocumentRequest {
  return {
    dossierId: form.dossierId,
    title: form.title,
    type: form.type,
    description: form.description,
    tags: form.tags,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
