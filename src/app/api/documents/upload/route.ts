import { auth } from '@/lib/clerk-auth';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { recordUsage } from '@/lib/billing/usage-billing';
import { scanDocumentAsync } from '@/lib/security/antivirus';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const DANGEROUS_EXTENSIONS = new Set([
  'exe',
  'dll',
  'bat',
  'cmd',
  'com',
  'scr',
  'msi',
  'js',
  'jse',
  'vbs',
  'vbe',
  'ps1',
  'psm1',
  'jar',
  'sh',
  'php',
  'py',
  'rb',
  'pl',
]);

const uploadPayloadSchema = z.object({
  dossierId: z.string().trim().min(1).max(100),
  type: z.string().trim().min(1).max(100).default('document'),
  description: z.string().trim().max(1000).default(''),
});

const listQuerySchema = z.object({
  dossierId: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function buildRateLimitIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${getClientIP(request)}`;
}

function withRateLimitHeaders(
  response: NextResponse,
  rateInfo: { remaining: number; reset: Date; limit: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(rateInfo.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateInfo.remaining));
  response.headers.set('X-RateLimit-Reset', rateInfo.reset.toISOString());
  return response;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[\\/]/g, '_')
    .replace(/[^a-zA-Z0-9._()\- ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot < 0 || lastDot === fileName.length - 1) {
    return '';
  }

  return fileName.slice(lastDot + 1).toLowerCase();
}

function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  ) {
    return 'application/x-ole-storage';
  }

  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return 'application/zip';
  }

  return null;
}

function looksLikePlainText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  if (sample.length === 0) {
    return true;
  }

  let nonTextBytes = 0;
  for (const b of sample) {
    const isControlAllowed = b === 9 || b === 10 || b === 13;
    const isPrintableAscii = b >= 32 && b <= 126;
    const isUtf8HighByte = b >= 128;
    if (!isControlAllowed && !isPrintableAscii && !isUtf8HighByte) {
      nonTextBytes += 1;
    }
  }

  return nonTextBytes / sample.length < 0.02;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/documents/upload
 * Upload un document pour un dossier
 * NOTE: Stockage fichiers en attente de configuration Vercel Blob
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const userId = user.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const rateInfo = await checkRateLimit(buildRateLimitIdentifier(request, userId), 'default');
    if (!rateInfo.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 }),
        rateInfo
      );
    }

    const declaredContentLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredContentLength) && declaredContentLength > MAX_REQUEST_SIZE) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Requête trop volumineuse' }, { status: 413 }),
        rateInfo
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get('file');

    const payloadResult = uploadPayloadSchema.safeParse({
      dossierId: formData.get('dossierId') ?? undefined,
      type: formData.get('type') ?? undefined,
      description: formData.get('description') ?? undefined,
    });

    if (!payloadResult.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 }),
        rateInfo
      );
    }

    const { dossierId, type, description } = payloadResult.data;

    if (!(fileEntry instanceof File)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Fichier requis' }, { status: 400 }),
        rateInfo
      );
    }

    const file = fileEntry;

    const safeFileName = sanitizeFileName(file.name);
    if (!safeFileName || safeFileName.length > 255) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 }),
        rateInfo
      );
    }

    // Validation taille
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
          { status: 400 }
        ),
        rateInfo
      );
    }

    // Validation type MIME déclaré
    if (!ALLOWED_TYPES.includes(file.type)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 }),
        rateInfo
      );
    }

    const extension = getFileExtension(safeFileName);
    if (extension && DANGEROUS_EXTENSIONS.has(extension)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Extension de fichier interdite' }, { status: 400 }),
        rateInfo
      );
    }

    if (!userId) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Accès interdit' }, { status: 403 }),
        rateInfo
      );
    }

    const access = await canAccessDossier({
      userId,
      tenantId,
      role: (user as { role?: string }).role,
      groups: (user as { groups?: string[] }).groups,
      dossierId,
      action: 'write',
    });

    if (!access.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Dossier non trouvé ou accès interdit' }, { status: 404 }),
        rateInfo
      );
    }

    // Générer ID unique
    const uniqueId = randomUUID();

    // Calculer hash pour dédoublonnage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detectedMime = detectMimeTypeFromBuffer(buffer);
    const isCompatibleBinaryType =
      detectedMime === file.type ||
      (detectedMime === 'application/x-ole-storage' && file.type === 'application/msword') ||
      (detectedMime === 'application/zip' &&
        [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ].includes(file.type));
    if (file.type !== 'text/plain' && !isCompatibleBinaryType) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: 'Le contenu du fichier ne correspond pas au type MIME déclaré' },
          { status: 400 }
        ),
        rateInfo
      );
    }

    if (file.type === 'text/plain' && !looksLikePlainText(buffer)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Le contenu du fichier texte est invalide' }, { status: 400 }),
        rateInfo
      );
    }

    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Sauvegarder le fichier localement si pas de Vercel Blob configuré
    let fileUrl: string | null = null;

    const containerName = process.env.AZURE_STORAGE_CONTAINER;
    if (containerName) {
      try {
        const blobName = `documents/${tenantId}/${uniqueId}/${safeFileName}`;
        const container = getBlobServiceClient().getContainerClient(containerName);
        const blob = container.getBlockBlobClient(blobName);
        await blob.uploadData(buffer, {
          blobHTTPHeaders: { blobContentType: file.type },
        });
        fileUrl = `azure://${containerName}/${blobName}`;
        logger.info('[UPLOAD] Fichier stocké sur Azure Blob');
      } catch {
        logger.error('[UPLOAD] Échec du stockage Azure');
      }
    }

    if (!fileUrl && process.env.NODE_ENV === 'production') {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: 'Le stockage privé des documents n’est pas configuré' },
          { status: 503 }
        ),
        rateInfo
      );
    }

    // Local storage is development-only and is served exclusively by the
    // authenticated download endpoint.
    if (!fileUrl) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads', uniqueId);
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, safeFileName);
        await fs.writeFile(filePath, buffer);
        fileUrl = `/uploads/${uniqueId}/${safeFileName}`;
        logger.info('[UPLOAD] Fichier stocké localement');
      } catch {
        logger.warn('[UPLOAD] Impossible de sauvegarder localement');
      }
    }

    if (!fileUrl) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Échec du stockage du fichier' }, { status: 500 }),
        rateInfo
      );
    }

    // Persist metadata and its audit trail atomically. The audit record only
    // contains operational metadata, never document names or content.
    const document = await prisma.$transaction(async tx => {
      const created = await tx.document.create({
        data: {
          id: uniqueId,
          tenantId,
          filename: safeFileName,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey: fileUrl,
          category: type,
          description: description || null,
          dossierId,
          uploadedBy: userId!,
          antivirusStatus: 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId,
          userEmail: user.email ?? '',
          userRole: user.role ?? 'UNKNOWN',
          action: 'CREATE',
          entityType: 'DOCUMENT',
          entityId: uniqueId,
          newValue: JSON.stringify({ mimeType: file.type, size: file.size }),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      });

      return created;
    });

    void scanDocumentAsync({
      documentId: document.id,
      fileName: safeFileName,
      mimeType: file.type,
      buffer,
    });

    // Facturer l'OCR si c'est un PDF (extraction texte)
    if (file.type === 'application/pdf') {
      const estimatedPages = Math.max(1, Math.ceil(file.size / 50000));
      recordUsage({
        tenantId,
        type: 'ocr',
        quantity: estimatedPages,
        metadata: { documentId: uniqueId, dossierId },
      }).catch(() => logger.warn('[UPLOAD] Erreur enregistrement usage OCR'));
    }

    logger.info('[UPLOAD] Document enregistré');

    // Horodatage certifié RFC 3161 (preuve tierce de la date de dépôt)
    try {
      const { certifyDocumentUpload } = await import('@/lib/services/certified-timestamp');
      await certifyDocumentUpload({
        tenantId,
        userId: userId!,
        documentId: uniqueId,
        documentHash: hash,
      });
      logger.info('[UPLOAD] Horodatage TSA certifié');
    } catch {
      // Non bloquant : le document est uploadé même si le TSA échoue
      logger.warn('[UPLOAD] TSA certification failed (non-blocking)');
    }

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        document: {
          id: document.id,
          fileName: document.filename,
          fileType: document.mimeType,
          fileSize: document.size,
          type: document.category,
          description: document.description,
          antivirusStatus: document.antivirusStatus,
        },
      }),
      rateInfo
    );
  } catch {
    logger.error('[UPLOAD] Erreur');
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

/**
 * GET /api/documents/upload
 * Liste les documents d'un dossier
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const userId = user.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const rateInfo = await checkRateLimit(buildRateLimitIdentifier(request, userId), 'default');
    if (!rateInfo.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 }),
        rateInfo
      );
    }

    const { searchParams } = new URL(request.url);
    const queryResult = listQuerySchema.safeParse({
      dossierId: searchParams.get('dossierId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!queryResult.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Paramètres de requête invalides' }, { status: 400 }),
        rateInfo
      );
    }

    const { dossierId, limit } = queryResult.data;

    if (!userId) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Accès interdit' }, { status: 403 }),
        rateInfo
      );
    }

    const access = await canAccessDossier({
      userId,
      tenantId,
      role: (user as { role?: string }).role,
      groups: (user as { groups?: string[] }).groups,
      dossierId,
      action: 'read',
    });

    if (!access.allowed) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Dossier non trouvé ou accès interdit' }, { status: 404 }),
        rateInfo
      );
    }

    const documents = await prisma.document.findMany({
      where: { dossierId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        category: true,
        description: true,
        size: true,
        dossierId: true,
        antivirusStatus: true,
        antivirusScannedAt: true,
        createdAt: true,
      },
    });

    return withRateLimitHeaders(
      NextResponse.json({
        documents,
        total: documents.length,
      }),
      rateInfo
    );
  } catch {
    logger.error('[DOCUMENTS] Erreur');
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}
