import { logger } from '@/lib/logger';
import { getSecurePrisma, withTenantContext, withTenantContextTransaction } from '@/lib/prisma';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import {
  DocumentStorageNotFoundError,
  InvalidDocumentStoragePathError,
  deleteDocumentObject,
  readDocumentBytes,
} from '@/lib/security/document-storage';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;
const documentIdSchema = z.string().trim().min(1).max(255);
const DOCUMENT_PURGE_ROLES = new Set([
  'ADMIN',
  'AVOCAT',
  'ASSOCIE',
  'COLLABORATEUR',
  'SECRETAIRE',
  'COMPTABLE',
  'LAWYER',
]);
const purgeConfirmationSchema = z
  .object({
    procedureApplied: z.literal(true),
  })
  .strict();

/**
 * GET /api/documents/download/[id]
 * TÃ©lÃ©charge un document par son ID depuis la base de donnÃ©es
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSessionCompat();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const { tenantId, clientId, role } = session.user;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvÃ©' }, { status: 403 });
    }

    const parsedDocumentId = documentIdSchema.safeParse((await params).id);

    if (!parsedDocumentId.success) {
      return NextResponse.json({ error: 'ID document requis' }, { status: 400 });
    }

    if (role === 'CLIENT' && !clientId) {
      return NextResponse.json({ error: 'Client non trouvÃ©' }, { status: 403 });
    }

    const prisma = await getSecurePrisma();
    const document = await prisma.document.findFirst({
      where: {
        id: parsedDocumentId.data,
        tenantId,
        ...(role === 'CLIENT' ? { OR: [{ clientId }, { Dossier: { clientId } }] } : {}),
      },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        filename: true,
        mimeType: true,
        storageKey: true,
        size: true,
        antivirusStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    if (document.antivirusStatus === 'INFECTED') {
      return NextResponse.json({ error: 'Document bloquÃ© par lâ€™antivirus' }, { status: 403 });
    }

    if (role === 'CLIENT' && document.antivirusStatus !== 'CLEAN') {
      return NextResponse.json({ error: 'Document en cours de vÃ©rification' }, { status: 423 });
    }

    const fileBuffer = await readDocumentBytes(document.storageKey);
    const safeFilename = document.filename.replace(/[^\w.-]/g, '_').slice(0, 255);
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': String(fileBuffer.length),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        Pragma: 'no-cache',
      },
    });
  } catch (error) {
    if (error instanceof InvalidDocumentStoragePathError) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }
    if (error instanceof DocumentStorageNotFoundError) {
      return NextResponse.json({ error: 'Fichier introuvable sur le serveur' }, { status: 404 });
    }
    logger.error('[DOWNLOAD] Erreur:', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Erreur lors du tÃ©lÃ©chargement' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const { id: userId, tenantId, role } = session.user;
    if (!tenantId || !userId || !role || !DOCUMENT_PURGE_ROLES.has(role)) {
      return NextResponse.json({ error: 'AccÃ¨s interdit' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Confirmation requise' }, { status: 400 });
    }
    if (!purgeConfirmationSchema.safeParse(body).success) {
      return NextResponse.json({ error: 'Confirmation explicite requise' }, { status: 400 });
    }

    const parsedDocumentId = documentIdSchema.safeParse((await params).id);
    if (!parsedDocumentId.success) {
      return NextResponse.json({ error: 'ID document invalide' }, { status: 400 });
    }

    const prisma = await getSecurePrisma();
    const document = await prisma.document.findFirst({
      where: { id: parsedDocumentId.data, tenantId },
      select: {
        id: true,
        storageKey: true,
        _count: { select: { Proof: true } },
      },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }
    if (document._count.Proof > 0) {
      return NextResponse.json(
        { error: 'Document liÃ© Ã  une preuve; suppression manuelle requise' },
        { status: 409 }
      );
    }

    const auditId = randomUUID();
    await withTenantContext(tenantId, transaction =>
      transaction.auditLog.create({
        data: {
          id: auditId,
          tenantId,
          userId,
          userEmail: 'not-recorded',
          userRole: role,
          action: 'DELETE',
          entityType: 'DOCUMENT',
          entityId: document.id,
          newValue: JSON.stringify({
            state: 'purge_requested',
            procedureApplied: true,
          }),
        },
      })
    );

    try {
      await deleteDocumentObject(document.storageKey);
    } catch (storageError) {
      logger.error('[DOCUMENT_PURGE] Storage deletion failed', {
        documentId: document.id,
        error: storageError instanceof Error ? storageError.name : 'UnknownError',
      });
      return NextResponse.json(
        { error: 'Suppression du fichier non confirmÃ©e; rÃ©essayez' },
        { status: 503 }
      );
    }

    const deleted = await withTenantContextTransaction(tenantId, async transaction => {
      const currentDocument = await transaction.document.findFirst({
        where: { id: document.id, tenantId },
        select: {
          id: true,
          _count: { select: { Proof: true } },
        },
      });
      if (!currentDocument) return false;
      if (currentDocument._count.Proof > 0) {
        throw new Error('Document became linked to a proof during purge.');
      }

      await transaction.document.delete({ where: { id: currentDocument.id } });
      await transaction.auditLog.update({
        where: { id: auditId },
        data: {
          newValue: JSON.stringify({
            state: 'storage_deleted',
            procedureApplied: true,
          }),
        },
      });
      return true;
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    return NextResponse.json({ success: true, storageDeleted: true });
  } catch (error) {
    logger.error('[DOCUMENT_PURGE] Erreur', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 503 });
  }
}
