$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Correction du module Documents ===" -ForegroundColor Cyan
Write-Host ""

function Backup-File {
    param([string]$Path)

    if (Test-Path -LiteralPath $Path) {
        $backup = "$Path.bak"
        Copy-Item -LiteralPath $Path -Destination $backup -Force
        Write-Host "Backup cree : $backup" -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------
# 1. DOCUMENT API DELETE
# ------------------------------------------------------------

$documentsApiDir = ".\src\app\api\documents\[id]"
New-Item -ItemType Directory -Path $documentsApiDir -Force | Out-Null

$documentRoutePath = Join-Path $documentsApiDir "route.ts"

Backup-File $documentRoutePath

$documentRoute = @'
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const user = session.user as {
      id?: string;
      tenantId?: string;
      role?: string;
      groups?: string[];
    };

    if (!user.id || !user.tenantId) {
      return NextResponse.json(
        { error: 'Acces interdit' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID document requis' },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        dossierId: true,
        storageKey: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouve' },
        { status: 404 }
      );
    }

    if (document.dossierId) {
      const access = await canAccessDossier({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        groups: user.groups,
        dossierId: document.dossierId,
        action: 'read',
      });

      if (!access.allowed) {
        return NextResponse.json(
          { error: 'Document non trouve' },
          { status: 404 }
        );
      }
    } else if (user.role === 'CLIENT') {
      return NextResponse.json(
        { error: 'Acces interdit' },
        { status: 403 }
      );
    }

    try {
      if (document.storageKey.startsWith('azure://')) {
        const storagePath = document.storageKey.slice('azure://'.length);
        const [container, ...blobParts] = storagePath.split('/');
        const blobName = blobParts.join('/');

        if (container && blobName) {
          await getBlobServiceClient()
            .getContainerClient(container)
            .getBlockBlobClient(blobName)
            .deleteIfExists();
        }
      } else if (document.storageKey.startsWith('/uploads/')) {
        const fs = await import('fs/promises');
        const path = await import('path');

        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const relativePath = document.storageKey.replace(/^\/uploads\//, '');

        if (
          relativePath.includes('..') ||
          relativePath.includes('%2e')
        ) {
          return NextResponse.json(
            { error: 'Chemin invalide' },
            { status: 400 }
          );
        }

        const filePath = path.resolve(uploadsDir, relativePath);

        if (!filePath.startsWith(uploadsDir + path.sep)) {
          return NextResponse.json(
            { error: 'Chemin invalide' },
            { status: 400 }
          );
        }

        await fs.unlink(filePath).catch(() => {});
      }
    } catch (storageError) {
      logger.warn('[DOCUMENT DELETE] Erreur suppression stockage', {
        documentId: id,
        error: storageError,
      });
    }

    await prisma.document.delete({
      where: {
        id: document.id,
      },
    });

    logger.info('[DOCUMENT DELETE] Document supprime', {
      documentId: document.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      id: document.id,
    });
  } catch (error) {
    logger.error('[DOCUMENT DELETE] Erreur:', { error });

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    );
  }
}
'@

Set-Content `
    -LiteralPath $documentRoutePath `
    -Value $documentRoute `
    -Encoding UTF8

Write-Host "OK : $documentRoutePath" -ForegroundColor Green


# ------------------------------------------------------------
# 2. storageService.ts
# ------------------------------------------------------------

$storageServicePath = ".\src\lib\services\storageService.ts"

Backup-File $storageServicePath

$storageService = @'
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
'@

Set-Content `
    -LiteralPath $storageServicePath `
    -Value $storageService `
    -Encoding UTF8

Write-Host "OK : $storageServicePath" -ForegroundColor Green


# ------------------------------------------------------------
# 3. PATCH de documents/page.tsx
# ------------------------------------------------------------

$pagePath = ".\src\app\[locale]\documents\page.tsx"

Backup-File $pagePath

$pageContent = Get-Content -LiteralPath $pagePath -Raw

$pageContent = $pageContent `
    -replace '/api/documents/download\?id=\$\{encodeURIComponent\(file\.id\)\}', '/api/documents/download/${encodeURIComponent(file.id)}'

$pageContent = $pageContent `
    -replace "category: 'piece_jointe',", "dossierId: getDossierId() || undefined,`r`n            category: 'piece_jointe',"

Set-Content `
    -LiteralPath $pagePath `
    -Value $pageContent `
    -Encoding UTF8

Write-Host "OK : $pagePath" -ForegroundColor Green

Write-Host ""
Write-Host "=== Correction terminee ===" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers modifies :" -ForegroundColor Cyan
Write-Host " - src\app\api\documents\[id]\route.ts"
Write-Host " - src\lib\services\storageService.ts"
Write-Host " - src\app\[locale]\documents\page.tsx"
Write-Host ""
Write-Host "Backups disponibles avec l'extension .bak" -ForegroundColor Yellow
