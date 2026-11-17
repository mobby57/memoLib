import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;
const documentIdSchema = z.string().trim().min(1).max(255);

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
        ...(role === 'CLIENT'
          ? { OR: [{ clientId }, { Dossier: { clientId } }] }
          : {}),
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

    if (/^https:\/\//i.test(document.storageKey)) {
      return NextResponse.redirect(document.storageKey);
    }

    if (document.storageKey.startsWith('/uploads/')) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadsRoot = path.resolve(process.cwd(), 'uploads');
        const filePath = path.resolve(process.cwd(), document.storageKey.slice(1));
        const relativePath = path.relative(uploadsRoot, filePath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
          return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
        }
        const fileBuffer = await fs.readFile(filePath);
        const safeFilename = document.filename.replace(/[^\w.-]/g, '_').slice(0, 255);

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': document.mimeType,
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Length': String(fileBuffer.length),
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-cache',
          },
        });
      } catch (fsError) {
        logger.warn('[DOWNLOAD] Fichier local non trouvÃ©', {
          error: fsError instanceof Error ? fsError.name : 'UnknownError',
        });
        return NextResponse.json({ error: 'Fichier non trouvÃ© sur le serveur' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Stockage non supportÃ©' }, { status: 500 });
  } catch (error) {
    logger.error('[DOWNLOAD] Erreur:', {
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Erreur lors du tÃ©lÃ©chargement' }, { status: 500 });
  }
}

