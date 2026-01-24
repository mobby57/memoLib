'use client';

import { safeLocalStorage } from '@/lib/localStorage';
import { logger } from '@/lib/logger';

/**
 * Service de gestion du stockage de documents
 * Supporte l'upload, le versioning et la gestion des fichiers
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
  parentId?: string // Pour le versioning
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
  parentId?: string // Pour creer une nouvelle version
}

/**
 * Upload un fichier vers le stockage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<StoredFile> {
  try {
    // Validation
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error(`Le fichier est trop volumineux (max ${maxSize / 1024 / 1024}MB)`)
    }

    // Types autorises
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorise')
    }

    // Simulation de l'upload (a remplacer par Azure Blob Storage, AWS S3, etc.)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('options', JSON.stringify(options))

    // Dans une vraie implementation, on ferait :
    // const response = await fetch('/api/storage/upload', {
    //   method: 'POST',
    //   body: formData,
    // })
    // const result = await response.json()

    // Simulation
    const version = options.parentId ? await getLatestVersion(options.parentId) + 1 : 1

    const storedFile: StoredFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generateSafeName(file.name),
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      url: URL.createObjectURL(file), // En production: URL du stockage cloud
      uploadedAt: new Date(),
      uploadedBy: 'current_user', // a recuperer depuis la session
      version,
      parentId: options.parentId,
      tags: options.tags || [],
      metadata: {
        dossierId: options.dossierId,
        clientId: options.clientId,
        category: options.category,
        description: options.description,
      },
    }

    // Sauvegarder dans le localStorage (simulation)
    const files = getStoredFiles()
    files.push(storedFile)
    safeLocalStorage.setItem('stored_files', JSON.stringify(files))

    logger.info('Fichier uploade avec succes', {
      fileId: storedFile.id,
      filename: storedFile.name,
      size: storedFile.size
    });

    return storedFile
  } catch (error) {
    logger.error('Erreur lors de l\'upload du fichier', error, {
      filename: file.name,
      size: file.size
    });
    throw error
  }
}

/**
 * Recupere tous les fichiers stockes
 */
export function getStoredFiles(filters?: {
  dossierId?: string
  clientId?: string
  category?: string
  tags?: string[]
}): StoredFile[] {
  const filesJson = safeLocalStorage.getItem('stored_files')
  let files: StoredFile[] = filesJson ? JSON.parse(filesJson) : []

  // Convertir les dates
  files = files.map(f => ({
    ...f,
    uploadedAt: new Date(f.uploadedAt),
  }))

  // Appliquer les filtres
  if (filters) {
    if (filters.dossierId) {
      files = files.filter(f => f.metadata.dossierId === filters.dossierId)
    }
    if (filters.clientId) {
      files = files.filter(f => f.metadata.clientId === filters.clientId)
    }
    if (filters.category) {
      files = files.filter(f => f.metadata.category === filters.category)
    }
    if (filters.tags && filters.tags.length > 0) {
      files = files.filter(f =>
        filters.tags!.some(tag => f.tags.includes(tag))
      )
    }
  }

  return files
}

/**
 * Recupere un fichier par son ID
 */
export function getFileById(fileId: string): StoredFile | null {
  const files = getStoredFiles()
  const file = files.find(f => f.id === fileId)
  return file || null
}

/**
 * Recupere toutes les versions d'un fichier
 */
export function getFileVersions(fileId: string): StoredFile[] {
  const files = getStoredFiles()
  const file = files.find(f => f.id === fileId)
  
  if (!file) return []

  // Trouver le fichier parent
  const parentId = file.parentId || fileId

  // Recuperer toutes les versions
  const versions = files.filter(
    f => f.id === parentId || f.parentId === parentId
  )

  return versions.sort((a, b) => a.version - b.version)
}

/**
 * Recupere la derniere version d'un fichier
 */
export function getLatestVersion(fileId: string): number {
  const versions = getFileVersions(fileId)
  if (versions.length === 0) return 0
  return Math.max(...versions.map(v => v.version))
}

/**
 * Supprime un fichier
 */
export async function deleteFile(fileId: string): Promise<void> {
  try {
    const files = getStoredFiles()
    const filteredFiles = files.filter(f => f.id !== fileId)
    safeLocalStorage.setItem('stored_files', JSON.stringify(filteredFiles))

    logger.info('Fichier supprime', { fileId });
  } catch (error) {
    logger.error('Erreur lors de la suppression du fichier', error, { fileId })
    throw error
  }
}

/**
 * Telecharge un fichier
 */
export function downloadFile(file: StoredFile): void {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.originalName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Genere un nom de fichier securise
 */
function generateSafeName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
  const safeName = nameWithoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
  
  return `${safeName}_${timestamp}_${random}.${extension}`
}

/**
 * Formate la taille du fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Recupere l'icone pour un type de fichier
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '[emoji]️'
  if (mimeType === 'application/pdf') return '[emoji]'
  if (mimeType.includes('word')) return '[emoji]'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '[emoji]'
  if (mimeType.includes('text')) return '[emoji]'
  return '[emoji]'
}

/**
 * Statistiques de stockage
 */
export function getStorageStats(): {
  totalFiles: number
  totalSize: number
  byCategory: Record<string, number>
  byType: Record<string, number>
} {
  const files = getStoredFiles()
  
  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    byCategory: {} as Record<string, number>,
    byType: {} as Record<string, number>,
  }

  files.forEach(file => {
    // Par categorie
    const cat = file.metadata.category
    stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1

    // Par type
    const type = file.mimeType.split('/')[0]
    stats.byType[type] = (stats.byType[type] || 0) + 1
  })

  return stats
}
