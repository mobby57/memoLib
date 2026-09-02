'use client';

import { logger } from '@/lib/logger';

export interface StoredFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  version: number;
  parentId?: string;
  tags: string[];
  metadata: {
    dossierId?: string;
    clientId?: string;
    category: 'piece_jointe' | 'document_genere' | 'template' | 'autre';
    description?: string;
  };
}

export interface FileVersion {
  version: number;
  uploadedAt: Date;
  uploadedBy: string;
  changes: string;
  fileId: string;
}

export interface UploadOptions {
  dossierId?: string;
  clientId?: string;
  category: StoredFile['metadata']['category'];
  description?: string;
  tags?: string[];
  parentId?: string;
}

export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<StoredFile> {
  const maxSize = 10 * 1024 * 1024;

  if (file.size === 0) {
    throw new Error('Le fichier est vide');
  }

  if (file.size > maxSize) {
    throw new Error('Le fichier est trop volumineux (max 10 MB)');
  }

  if (!options.dossierId) {
    throw new Error('Dossier requis pour envoyer le fichier');
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Type de fichier non autorise');
  }

  const formData = new FormData();

  formData.append('file', file);
  formData.append('dossierId', options.dossierId);
  formData.append('type', options.category || 'piece_jointe');
  formData.append('description', options.description || '');

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Erreur lors de l'upload (${response.status})`
    );
  }

  if (!data.document?.id) {
    throw new Error('Reponse serveur invalide');
  }

  const document = data.document;

  const storedFile: StoredFile = {
    id: document.id,
    name: document.fileName || document.filename || file.name,
    originalName: document.originalName || file.name,
    size: document.fileSize ?? document.size ?? file.size,
    mimeType: document.fileType || document.mimeType || file.type,
    url: `/api/documents/download/${encodeURIComponent(document.id)}`,
    uploadedAt: new Date(),
    uploadedBy: 'current_user',
    version: 1,
    parentId: options.parentId,
    tags: options.tags || [],
    metadata: {
      dossierId: options.dossierId,
      clientId: options.clientId,
      category: options.category || 'piece_jointe',
      description: options.description,
    },
  };

  logger.info('Fichier uploade avec succes', {
    fileId: storedFile.id,
    filename: storedFile.name,
    size: storedFile.size,
  });

  return storedFile;
}

export function downloadFile(file: StoredFile): void {
  const link = document.createElement('a');

  link.href = `/api/documents/download/${encodeURIComponent(file.id)}`;
  link.download = file.originalName;
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'PDF';
  if (mimeType.includes('word')) return 'Word';

  if (
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet')
  ) {
    return 'Excel';
  }

  if (mimeType.includes('text')) return 'Texte';

  return 'Fichier';
}

export function getStorageStats(): {
  totalFiles: number;
  totalSize: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
} {
  return {
    totalFiles: 0,
    totalSize: 0,
    byCategory: {},
    byType: {},
  };
}

export async function getStoredFiles(filters?: {
  dossierId?: string;
  clientId?: string;
  category?: string;
  tags?: string[];
}): Promise<StoredFile[]> {
  if (!filters?.dossierId) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('dossierId', filters.dossierId);
  params.set('limit', '100');

  const response = await fetch(
    `/api/documents/upload?${params.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || 'Impossible de recuperer les documents'
    );
  }

  return (data.documents || []).map(
    (document: any): StoredFile => ({
      id: document.id,
      name: document.filename,
      originalName: document.originalName || document.filename,
      size: document.size,
      mimeType: document.mimeType,
      url: `/api/documents/download/${encodeURIComponent(document.id)}`,
      uploadedAt: new Date(document.createdAt),
      uploadedBy: document.uploadedBy || '',
      version: 1,
      tags: [],
      metadata: {
        dossierId: document.dossierId || undefined,
        clientId: document.clientId || undefined,
        category:
          document.category === 'piece_jointe' ||
          document.category === 'document_genere' ||
          document.category === 'template' ||
          document.category === 'autre'
            ? document.category
            : 'autre',
        description: document.description || undefined,
      },
    })
  );
}

export async function getFileVersions(
  fileId: string
): Promise<StoredFile[]> {
  const response = await fetch(
    `/api/documents/download/${encodeURIComponent(fileId)}`,
    {
      method: 'HEAD',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    return [];
  }

  return [];
}

export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || 'Impossible de supprimer le document'
    );
  }

  logger.info('Fichier supprime', { fileId });
}
