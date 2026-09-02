import { auth } from '@/lib/clerk-auth';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const documentIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);

function rateLimitedResponse(reset: Date): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))) },
    }
  );
}

function canManageTenantDocuments(role?: string): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }
    if (!user || !user.id || !user.tenantId) {
      return NextResponse.json(
        { error: 'Acces interdit' },
        { status: 403 }
      );
    }

    const idResult = documentIdSchema.safeParse((await params).id);
    if (!idResult.success) {
      return NextResponse.json(
        { error: 'ID document invalide' },
        { status: 400 }
      );
    }
    const id = idResult.data;

    const rateLimit = await checkRateLimit(`document-delete:${user.id}:${getClientIP(request)}`, 'default');
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.reset);
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
        uploadedBy: true,
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
        action: 'manage',
      });

      if (!access.allowed) {
        return NextResponse.json(
          { error: 'Document non trouve' },
          { status: 404 }
        );
      }
    } else if (document.uploadedBy !== user.id && !canManageTenantDocuments(user.role)) {
      return NextResponse.json(
        { error: 'Document non trouve' },
        { status: 404 }
      );
    }

    try {
      if (document.storageKey.startsWith('azure://')) {
        const azureStorage = parseAzureStorageKey(document.storageKey);
        if (
          !azureStorage ||
          azureStorage.container !== process.env.AZURE_STORAGE_CONTAINER ||
          !azureStorage.blobName.startsWith(`documents/${user.tenantId}/`)
        ) {
          return NextResponse.json({ error: 'Stockage document indisponible' }, { status: 503 });
        }

        await getBlobServiceClient()
          .getContainerClient(azureStorage.container)
          .getBlockBlobClient(azureStorage.blobName)
          .deleteIfExists();
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

        try {
          await fs.unlink(filePath);
        } catch (error) {
          if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) {
            throw error;
          }
        }
      } else {
        return NextResponse.json({ error: 'Stockage document indisponible' }, { status: 503 });
      }
    } catch {
      logger.warn('[DOCUMENT DELETE] Erreur suppression stockage');
      return NextResponse.json({ error: 'Suppression du stockage impossible' }, { status: 503 });
    }

    await prisma.$transaction(async tx => {
      await tx.document.delete({
        where: {
          id: document.id,
        },
      });
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: user.tenantId!,
          userId: user.id,
          userEmail: user.email ?? '',
          userRole: user.role ?? 'UNKNOWN',
          action: 'DELETE',
          entityType: 'DOCUMENT',
          entityId: document.id,
          oldValue: JSON.stringify({ storage: 'deleted' }),
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') ?? undefined,
        },
      });
    });

    logger.info('[DOCUMENT DELETE] Document supprime');

    return NextResponse.json({
      success: true,
      id: document.id,
    });
  } catch {
    logger.error('[DOCUMENT DELETE] Erreur');

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    );
  }
}
