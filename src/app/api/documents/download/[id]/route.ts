import { auth } from '@/lib/clerk-auth';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const documentIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const ALLOWED_DOWNLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

function rateLimitedResponse(reset: Date): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))) },
    }
  );
}

/**
 * GET /api/documents/download/[id]
 * Télécharge un document par son ID depuis la base de données
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const idResult = documentIdSchema.safeParse((await params).id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID document invalide' }, { status: 400 });
    }
    const id = idResult.data;

    if (!user.id || !tenantId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const rateLimit = await checkRateLimit(`document-download:${user.id}:${getClientIP(request)}`, 'default');
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.reset);
    }

    // Chercher le document en base de données
    const document = await prisma.document.findFirst({
      where: {
        id,
        dossier: {
          tenantId,
        },
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        storageKey: true,
        size: true,
        dossierId: true,
        antivirusStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    const access = await canAccessDossier({
      userId: user.id,
      tenantId,
      role: user.role,
      groups: user.groups,
      dossierId: document.dossierId,
      action: 'read',
    });
    if (!access.allowed) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    if (document.antivirusStatus !== 'CLEAN') {
      return NextResponse.json({ error: 'Document en attente de validation antivirus' }, { status: 423 });
    }

    const azureStorage = parseAzureStorageKey(document.storageKey);
    if (azureStorage) {
      if (
        azureStorage.container !== process.env.AZURE_STORAGE_CONTAINER ||
        !azureStorage.blobName.startsWith(`documents/${tenantId}/`)
      ) {
        return NextResponse.json({ error: 'Stockage document indisponible' }, { status: 503 });
      }

      const fileBuffer = await getBlobServiceClient()
        .getContainerClient(azureStorage.container)
        .getBlockBlobClient(azureStorage.blobName)
        .downloadToBuffer();

      return createDownloadResponse(fileBuffer, document.originalName, document.mimeType);
    }

    // Public object URLs are not authorization tokens. Legacy public objects
    // must be migrated into private storage before they can be downloaded.
    if (document.storageKey.startsWith('http')) {
      return NextResponse.json({ error: 'Document en attente de migration sécurisée' }, { status: 503 });
    }

    // Si c'est un fichier local (développement)
    if (document.storageKey.startsWith('/uploads/')) {
      try {
        const fs = await import('fs/promises');

        const filePath = resolveLocalUploadPath(document.storageKey);
        if (!filePath) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Vérifier que le fichier existe
        try {
          await fs.access(filePath);
        } catch {
          return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);

        return createDownloadResponse(fileBuffer, document.originalName, document.mimeType);
      } catch {
        logger.warn('[DOWNLOAD] Fichier local non trouvé');
        return NextResponse.json({ error: 'Fichier non trouvé sur le serveur' }, { status: 404 });
      }
    }

    // Aucun stockage configuré
    return NextResponse.json({
      message: 'Stockage fichiers non configuré',
      document: {
        id: document.id,
        name: document.originalName,
        type: document.mimeType,
        size: document.size,
      },
      suggestion: 'Configurez un fournisseur de stockage privé',
    });
  } catch {
    logger.error('[DOWNLOAD] Erreur');
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}

function parseAzureStorageKey(storageKey: string): { container: string; blobName: string } | null {
  if (!storageKey.startsWith('azure://')) {
    return null;
  }

  const [container, ...blobParts] = storageKey.slice('azure://'.length).split('/');
  const blobName = blobParts.join('/');
  if (!container || !blobName || blobName.includes('..') || blobName.includes('\\')) {
    return null;
  }

  return { container, blobName };
}

function resolveLocalUploadPath(storageKey: string): string | null {
  const match = /^\/uploads\/([A-Za-z0-9_-]{1,128})\/([A-Za-z0-9._() -]{1,255})$/.exec(storageKey);
  if (!match) {
    return null;
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const filePath = path.resolve(uploadsDir, match[1], match[2]);
  return filePath.startsWith(uploadsDir + path.sep) ? filePath : null;
}

function createDownloadResponse(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): NextResponse {
  const safeFilename = originalName
    .replace(/[^\w\s.-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 255);

  const contentType = ALLOWED_DOWNLOAD_TYPES.has(mimeType)
    ? mimeType
    : getContentType(originalName);

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': ALLOWED_DOWNLOAD_TYPES.has(contentType)
        ? contentType
        : 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Content-Length': String(fileBuffer.length),
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
}

/**
 * Retourne le content-type basé sur l'extension du fichier
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    txt: 'text/plain',
  };
  return types[ext || ''] || 'application/octet-stream';
}
