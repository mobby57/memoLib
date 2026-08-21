import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { scanDocumentAsync } from '@/lib/security/antivirus';
import { createHash, randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

const payloadSchema = z.object({
  dossierId: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
});

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[\\/]/g, '_')
    .replace(/[^a-zA-Z0-9._()\- ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

function matchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    return buffer.subarray(0, 4).equals(Buffer.from('%PDF'));
  }

  if (mimeType === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  return (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  );
}

function rateLimitHeaders(
  response: NextResponse,
  rateInfo: { limit: number; remaining: number; reset: Date }
) {
  response.headers.set('X-RateLimit-Limit', String(rateInfo.limit));
  response.headers.set('X-RateLimit-Remaining', String(rateInfo.remaining));
  response.headers.set('X-RateLimit-Reset', rateInfo.reset.toISOString());
  return response;
}

function getQuarantineDirectory(tenantId: string): string | null {
  const storageRoot = process.env.VAULT_STORAGE_ROOT;
  if (storageRoot) {
    return join(storageRoot, tenantId);
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return join(process.cwd(), 'uploads', 'client-quarantine', tenantId);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const userId = user.id;
    const tenantId = user.tenantId;
    const clientId = user.clientId;
    if (!userId || !tenantId || !clientId) {
      return NextResponse.json({ error: 'Compte client incomplet' }, { status: 403 });
    }

    const rateInfo = await checkRateLimit(
      `client-vault:${userId}:${getClientIP(request)}`,
      'default'
    );
    if (!rateInfo.success) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Trop de requêtes. Réessayez plus tard.' }, { status: 429 }),
        rateInfo
      );
    }

    const formData = await request.formData();
    const payload = payloadSchema.safeParse({
      dossierId: formData.get('dossierId'),
      description: formData.get('description') || undefined,
    });
    const fileEntry = formData.get('file');

    if (!payload.success || !(fileEntry instanceof File)) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Données de dépôt invalides' }, { status: 400 }),
        rateInfo
      );
    }

    const file = fileEntry;
    const safeFileName = sanitizeFileName(file.name);
    if (!safeFileName || file.size === 0 || file.size > MAX_FILE_SIZE) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Fichier invalide ou trop volumineux' }, { status: 400 }),
        rateInfo
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Format de fichier non autorisé' }, { status: 400 }),
        rateInfo
      );
    }

    const dossier = await prisma.dossier.findFirst({
      where: { id: payload.data.dossierId, tenantId, clientId },
      select: { id: true },
    });
    if (!dossier) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 }),
        rateInfo
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesDeclaredType(buffer, file.type)) {
      return rateLimitHeaders(
        NextResponse.json(
          { error: 'Le contenu ne correspond pas au format déclaré' },
          { status: 400 }
        ),
        rateInfo
      );
    }

    const documentId = randomUUID();
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    const directory = getQuarantineDirectory(tenantId);
    if (!directory) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Coffre-fort documentaire indisponible' }, { status: 503 }),
        rateInfo
      );
    }

    const storageKey = `client-quarantine/${tenantId}/${documentId}`;
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, documentId), buffer, { flag: 'wx' });

    await prisma.$transaction([
      prisma.document.create({
        data: {
          id: documentId,
          tenantId,
          clientId,
          dossierId: dossier.id,
          filename: safeFileName,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          storageKey,
          category: 'client-upload',
          description: payload.data.description || null,
          uploadedBy: userId,
          sha256,
          antivirusStatus: 'PENDING',
        },
      }),
      prisma.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId,
          userId,
          userEmail: user.email ?? '',
          userRole: user.role,
          action: 'CREATE',
          entityType: 'DOCUMENT',
          entityId: documentId,
          newValue: JSON.stringify({
            sha256,
            size: file.size,
            mimeType: file.type,
            source: 'client-vault',
          }),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      }),
    ]);

    void scanDocumentAsync({ documentId, fileName: safeFileName, mimeType: file.type, buffer });

    logger.info('[CLIENT_VAULT] Document accepted for quarantine scan', {
      documentId,
      tenantId,
      dossierId: dossier.id,
      sha256,
    });

    return rateLimitHeaders(
      NextResponse.json(
        {
          success: true,
          document: {
            id: documentId,
            filename: safeFileName,
            size: file.size,
            antivirusStatus: 'PENDING',
          },
        },
        { status: 201 }
      ),
      rateInfo
    );
  } catch (error) {
    logger.error('[CLIENT_VAULT] Upload failed', { error });
    return NextResponse.json({ error: 'Erreur lors du dépôt sécurisé' }, { status: 500 });
  }
}
