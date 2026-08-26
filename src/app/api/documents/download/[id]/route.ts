import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/documents/download/[id]
 * Télécharge un document par son ID depuis la base de données
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = session.user as { id?: string; tenantId?: string; role?: string; groups?: string[] };
    const tenantId = user.tenantId;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID document requis' }, { status: 400 });
    }

    if (!user.id || !tenantId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
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
      if (azureStorage.container !== process.env.AZURE_STORAGE_CONTAINER) {
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
        const path = await import('path');

        // 🛡️ SÉCURITÉ: Protection contre Path Traversal
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const requestedPath = path.normalize(document.storageKey);

        // Vérifier que le chemin ne contient pas de séquences dangereuses
        if (requestedPath.includes('..') || requestedPath.includes('%2e')) {
          logger.warn('[DOWNLOAD] Tentative de Path Traversal détectée', {
            path: document.storageKey,
            userId: session.user.id,
          });
          return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
        }

        // Construire le chemin absolu et vérifier qu'il reste dans uploads
        // Note: Pour la production, les fichiers doivent être stockés dans le service cloud
        // En développement uniquement: les fichiers sont dans le dossier uploads
        const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd();
        const filePath = path.resolve(baseDir, requestedPath.replace(/^\//, ''));
        const normalizedUploadsDir = path.resolve(baseDir, uploadsDir);

        if (!filePath.startsWith(normalizedUploadsDir)) {
          logger.warn("[DOWNLOAD] Tentative d'accès hors du dossier uploads", {
            requestedPath: filePath,
            allowedDir: normalizedUploadsDir,
            userId: session.user.id,
          });
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
      } catch (fsError) {
        logger.warn('[DOWNLOAD] Fichier local non trouvé', { path: document.storageKey, error: fsError });
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
  } catch (error) {
    logger.error('[DOWNLOAD] Erreur:', { error });
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}

function parseAzureStorageKey(storageKey: string): { container: string; blobName: string } | null {
  if (!storageKey.startsWith('azure://')) {
    return null;
  }

  const [container, ...blobParts] = storageKey.slice('azure://'.length).split('/');
  const blobName = blobParts.join('/');
  if (!container || !blobName || blobName.includes('..')) {
    return null;
  }

  return { container, blobName };
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

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': mimeType || getContentType(originalName),
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
