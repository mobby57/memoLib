import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { withTenantContext, withTenantContextBatch } from '@/lib/prisma';
import { scanDocumentAsync } from '@/lib/security/antivirus';
import { randomUUID } from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { findActiveClientDossierGrant } from '@/lib/client-access';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  DocumentStorageUnavailableError,
  deleteDocumentObject,
  storeEncryptedDocument,
} from '@/lib/security/document-storage';

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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const rateInfo = await checkRateLimit(`client-vault:${clerkUserId}:${getClientIP(request)}`);
    if (!rateInfo.success) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Trop de requÃªtes. RÃ©essayez plus tard.' }, { status: 429 }),
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
        NextResponse.json({ error: 'DonnÃ©es de dÃ©pÃ´t invalides' }, { status: 400 }),
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
        NextResponse.json({ error: 'Format de fichier non autorisÃ©' }, { status: 400 }),
        rateInfo
      );
    }

    const access = await findActiveClientDossierGrant(clerkUserId, payload.data.dossierId);
    if (!access) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'AccÃ¨s refusÃ© ou expirÃ©' }, { status: 403 }),
        rateInfo
      );
    }

    const { tenantId } = access.grant;
    const { user } = access;
    const dossier = await withTenantContext<{ id: string } | null>(tenantId, transaction =>
      transaction.dossier.findFirst({
        where: { id: payload.data.dossierId, tenantId },
        select: { id: true },
      })
    );
    if (!dossier) {
      return rateLimitHeaders(
        NextResponse.json({ error: 'Dossier non trouvÃ©' }, { status: 404 }),
        rateInfo
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!matchesDeclaredType(buffer, file.type)) {
      return rateLimitHeaders(
        NextResponse.json(
          { error: 'Le contenu ne correspond pas au format dÃ©clarÃ©' },
          { status: 400 }
        ),
        rateInfo
      );
    }

    const documentId = randomUUID();
    let storageKey: string;
    try {
      storageKey = await storeEncryptedDocument(
        tenantId,
        documentId,
        'client-quarantine',
        buffer
      );
    } catch (storageError) {
      if (storageError instanceof DocumentStorageUnavailableError) {
        return rateLimitHeaders(
          NextResponse.json({ error: 'Coffre-fort documentaire indisponible' }, { status: 503 }),
          rateInfo
        );
      }
      throw storageError;
    }

    try {
      await withTenantContextBatch(tenantId, transaction => [
        transaction.document.create({
          data: {
            id: documentId,
            tenantId,
            clientId: user.clientId,
            dossierId: dossier.id,
            filename: safeFileName,
            originalName: safeFileName,
            mimeType: file.type,
            size: file.size,
            storageKey,
            category: 'client-upload',
            description: payload.data.description || null,
            uploadedBy: user.id,
            antivirusStatus: 'PENDING',
          },
        }),
        transaction.auditLog.create({
          data: {
            id: randomUUID(),
            tenantId,
            userId: user.id,
            userEmail: 'not-recorded',
            userRole: user.role,
            action: 'CREATE',
            entityType: 'DOCUMENT',
            entityId: documentId,
            newValue: JSON.stringify({
              size: file.size,
              mimeType: file.type,
              source: 'client-vault',
            }),
          },
        }),
      ]);
    } catch (databaseError) {
      await deleteDocumentObject(storageKey);
      throw databaseError;
    }

    void scanDocumentAsync({
      documentId,
      mimeType: file.type,
      buffer,
      tenantId,
    }).catch(error => {
      logger.error('[CLIENT_VAULT] Antivirus scan failed', {
        documentId,
        error: error instanceof Error ? error.name : 'UnknownError',
      });
    });

    logger.info('[CLIENT_VAULT] Document accepted for quarantine scan', {
      documentId,
      tenantId,
      dossierId: dossier.id,
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
    logger.error('[CLIENT_VAULT] Upload failed', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Erreur lors du dÃ©pÃ´t sÃ©curisÃ©' }, { status: 500 });
  }
}

