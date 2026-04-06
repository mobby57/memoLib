import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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

const uploadPayloadSchema = z.object({
  dossierId: z.string().trim().min(1).max(100).optional(),
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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as { tenantId?: string; id?: string };
    const tenantId = user.tenantId;
    const userId = user.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
    }

    const rateInfo = await checkRateLimit(buildRateLimitIdentifier(request, userId), 'default');
    if (!rateInfo.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Trop de requetes. Reessayez plus tard.' }, { status: 429 }),
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
        NextResponse.json({ error: 'Parametres invalides' }, { status: 400 }),
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

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      return withRateLimitHeaders(
        NextResponse.json(
          { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
          { status: 400 }
        ),
        rateInfo
      );
    }

    // Validation type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Type de fichier non autorise' }, { status: 400 }),
        rateInfo
      );
    }

    // Verifier que le dossier appartient au tenant
    if (dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: { id: dossierId, tenantId },
      });

      if (!dossier) {
        return withRateLimitHeaders(
          NextResponse.json({ error: 'Dossier non trouve ou acces interdit' }, { status: 404 }),
          rateInfo
        );
      }
    }

    // Generer ID unique
    const uniqueId = randomUUID();

    // Calculer hash pour deduplication
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Sauvegarder le fichier localement si pas de Vercel Blob configuré
    let fileUrl: string | null = null;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Vercel Blob configuré - utiliser pour stockage cloud
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(`documents/${uniqueId}/${safeFileName}`, buffer, {
          access: 'public',
        });
        fileUrl = blob.url;
        logger.info('[UPLOAD] Fichier stocké sur Vercel Blob', { url: fileUrl });
      } catch (blobError) {
        logger.warn('[UPLOAD] Erreur Vercel Blob, fallback local', { error: blobError });
      }
    }

    // Fallback: stockage local (si pas de Vercel Blob configuré)
    if (!fileUrl) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'uploads', uniqueId);
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, safeFileName);
        await fs.writeFile(filePath, buffer);
        fileUrl = `/uploads/${uniqueId}/${safeFileName}`;
        logger.info('[UPLOAD] Fichier stocké localement', { path: filePath });
      } catch (fsError) {
        logger.warn('[UPLOAD] Impossible de sauvegarder localement', { error: fsError });
      }
    }

    if (!fileUrl) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Echec du stockage du fichier' }, { status: 500 }),
        rateInfo
      );
    }

    // Sauvegarder les métadonnées en base
    const document = await prisma.document.create({
      data: {
        id: uniqueId,
        name: safeFileName,
        type: type,
        size: file.size,
        url: fileUrl,
        dossierId: dossierId || undefined,
      },
    });

    logger.info('[UPLOAD] Document enregistre:', {
      id: uniqueId,
      name: safeFileName,
      hash,
      description,
      stored: !!fileUrl,
    });

    return withRateLimitHeaders(
      NextResponse.json({
        success: true,
        document: {
          id: document.id,
          fileName: safeFileName,
          fileType: file.type,
          fileSize: file.size,
          type,
          description,
          url: fileUrl,
        },
      }),
      rateInfo
    );
  } catch (error) {
    logger.error('[UPLOAD] Erreur:', { error });
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}

/**
 * GET /api/documents/upload
 * Liste les documents d'un dossier
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as { tenantId?: string; id?: string };
    const tenantId = user.tenantId;
    const userId = user.id;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
    }

    const rateInfo = await checkRateLimit(buildRateLimitIdentifier(request, userId), 'default');
    if (!rateInfo.success) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Trop de requetes. Reessayez plus tard.' }, { status: 429 }),
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
        NextResponse.json({ error: 'Parametres de requete invalides' }, { status: 400 }),
        rateInfo
      );
    }

    const { dossierId, limit } = queryResult.data;

    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, tenantId },
      select: { id: true },
    });

    if (!dossier) {
      return withRateLimitHeaders(
        NextResponse.json({ error: 'Dossier non trouve ou acces interdit' }, { status: 404 }),
        rateInfo
      );
    }

    const documents = await prisma.document.findMany({
      where: { dossierId },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        url: true,
        dossierId: true,
      },
    });

    return withRateLimitHeaders(
      NextResponse.json({
        documents,
        total: documents.length,
      }),
      rateInfo
    );
  } catch (error) {
    logger.error('[DOCUMENTS] Erreur:', { error });
    return NextResponse.json({ error: 'Erreur lors de la recuperation' }, { status: 500 });
  }
}
