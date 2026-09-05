$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$file = Join-Path $root "src\lib\services\storageService.ts"

Write-Host "=== Correction de storageService.ts ===" -ForegroundColor Cyan

if (-not (Test-Path $file)) {
    throw "Fichier introuvable : $file"
}

$content = @'
'use client';

import { logger } from '@/lib/logger';

/**
 * Service de gestion du stockage de documents.
 *
 * L'upload est effectué via /api/documents/upload.
 * Le stockage réel est géré côté serveur (Azure Blob ou stockage local
 * de développement).
 */

export interface StoredFile {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  url: string
  uploadedAt: Date
  uploadedBy: string
  version: number
  parentId?: string
  tags: string[]
  metadata: {
    dossierId?: string
    clientId?: string
    category: 'piece_jointe' | 'document_genere' | 'template' | 'autre'
    description?: string
  }
}

export interface FileVersion {
  version: number
  uploadedAt: Date
  uploadedBy: string
  changes: string
  fileId: string
}

export interface UploadOptions {
  dossierId?: string
  clientId?: string
  category: StoredFile['metadata']['category']
  description?: string
  tags?: string[]
  parentId?: string
}

/**
 * Upload un fichier via l'API sécurisée.
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<StoredFile> {
  try {
    const maxSize = 10 * 1024 * 1024

    if (file.size === 0) {
      throw new Error('Le fichier est vide')
    }

    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux (max 10MB)')
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé')
    }

    if (!options.dossierId) {
      throw new Error('Dossier requis pour envoyer le fichier')
    }

    const formData = new FormData()

    formData.append('file', file)
    formData.append('dossierId', options.dossierId)
    formData.append('type', options.category || 'piece_jointe')
    formData.append('description', options.description || '')

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    let data: {
      success?: boolean
      error?: string
      document?: {
        id: string
        fileName: string
        fileType: string
        fileSize: number
        type: string
        description?: string | null
        antivirusStatus?: string
      }
    }

    try {
      data = await response.json()
    } catch {
      throw new Error(
        `Erreur serveur lors de l'upload (${response.status})`
      )
    }

    if (!response.ok) {
      throw new Error(
        data.error || `Erreur lors de l'upload (${response.status})`
      )
    }

    if (!data.document?.id) {
      throw new Error('Réponse serveur invalide')
    }

    const document = data.document

    const storedFile: StoredFile = {
      id: document.id,
      name: document.fileName,
      originalName: file.name,
      size: document.fileSize,
      mimeType: document.fileType,
      url: `/api/documents/download?id=${encodeURIComponent(document.id)}`,
      uploadedAt: new Date(),
      uploadedBy: 'current_user',
      version: 1,
      parentId: options.parentId,
      tags: options.tags || [],
      metadata: {
        dossierId: options.dossierId,
        clientId: options.clientId,
        category: options.category,
        description: options.description,
      },
    }

    logger.info('Fichier uploadé avec succès', {
      fileId: storedFile.id,
      filename: storedFile.name,
      size: storedFile.size,
      antivirusStatus: document.antivirusStatus,
    })

    return storedFile
  } catch (error) {
    logger.error('Erreur lors de l\'upload du fichier', error, {
      filename: file.name,
      size: file.size,
    })

    throw error
  }
}

/**
 * Télécharge un document via l'API sécurisée.
 */
export function downloadFile(file: StoredFile): void {
  const url = file.url.startsWith('/api/documents/download')
    ? file.url
    : `/api/documents/download?id=${encodeURIComponent(file.id)}`

  const link = document.createElement('a')
  link.href = url
  link.download = file.originalName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Formate la taille du fichier.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return (
    Math.round((bytes / Math.pow(k, i)) * 100) / 100 +
    ' ' +
    sizes[i]
  )
}

/**
 * Retourne l'icône correspondant au type MIME.
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word')) return '📘'
  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet')
  ) {
    return '📗'
  }
  if (mimeType.includes('text')) return '📄'

  return '📎'
}

/**
 * Statistiques locales supprimées :
 * les documents doivent maintenant être récupérés depuis l'API/Prisma.
 *
 * Cette fonction est conservée uniquement pour compatibilité avec
 * d'anciens composants.
 */
export function getStorageStats(): {
  totalFiles: number
  totalSize: number
  byCategory: Record<string, number>
  byType: Record<string, number>
} {
  return {
    totalFiles: 0,
    totalSize: 0,
    byCategory: {},
    byType: {},
  }
}
'@

Set-Content -Path $file -Value $content -Encoding UTF8

Write-Host ""
Write-Host "storageService.ts remplacé avec succès." -ForegroundColor Green
Write-Host ""
Write-Host "Vérification TypeScript..." -ForegroundColor Cyan

Push-Location $root

try {
    npx tsc --noEmit

    if ($LASTEXITCODE -ne 0) {
        throw "TypeScript a détecté des erreurs."
    }

    Write-Host ""
    Write-Host "=== TypeScript OK ===" -ForegroundColor Green
}
finally {
    Pop-Location
}