import { getSecurePrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import {
  DocumentStorageNotFoundError,
  InvalidDocumentStoragePathError,
  readDocumentBytes,
} from '@/lib/security/document-storage';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const documentIdSchema = z.string().trim().min(1).max(255);

/**
 * GET /api/documents/download?id=xxx
 * Streams a tenant-authorized document without exposing its storage URL.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const clientId = session.user.clientId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvÃ©' }, { status: 403 });
    }

    const parsedDocumentId = documentIdSchema.safeParse(request.nextUrl.searchParams.get('id'));
    if (!parsedDocumentId.success) {
      return NextResponse.json({ error: 'Document ID requis' }, { status: 400 });
    }

    if (session.user.role === 'CLIENT' && !clientId) {
      return NextResponse.json({ error: 'Client non trouvÃ©' }, { status: 403 });
    }

    const prisma = await getSecurePrisma();
    const document = await prisma.document.findFirst({
      where: {
        id: parsedDocumentId.data,
        tenantId,
        ...(session.user.role === 'CLIENT'
          ? { OR: [{ clientId }, { Dossier: { clientId } }] }
          : {}),
      },
      select: {
        id: true,
        storageKey: true,
        filename: true,
        mimeType: true,
        antivirusStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    if (document.antivirusStatus === 'INFECTED') {
      return NextResponse.json({ error: 'Document bloquÃ© par lâ€™antivirus' }, { status: 403 });
    }

    if (session.user.role === 'CLIENT' && document.antivirusStatus !== 'CLEAN') {
      return NextResponse.json({ error: 'Document en cours de vÃ©rification' }, { status: 423 });
    }

    const buffer = await readDocumentBytes(document.storageKey);
    const safeFilename = document.filename.replace(/[^\w.-]/g, '_').slice(0, 255);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': String(buffer.length),
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
      return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 });
    }
    logger.error('[DOWNLOAD] Erreur:', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Erreur lors du tÃ©lÃ©chargement' }, { status: 500 });
  }
}
