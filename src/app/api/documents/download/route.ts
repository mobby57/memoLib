import { getSecurePrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
const documentIdSchema = z.string().trim().min(1).max(255);

/**
 * GET /api/documents/download?id=xxx
 * Returns a signed download URL for a private Vercel Blob document,
 * or streams the file from local storage.
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

    // Local file fallback â€” stream the file
    if (
      document.storageKey.startsWith('/uploads/') ||
      document.storageKey.startsWith('client-quarantine/')
    ) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const isQuarantined = document.storageKey.startsWith('client-quarantine/');
      const storageRoot = path.resolve(
        isQuarantined
          ? process.env.VAULT_STORAGE_ROOT ?? path.join(process.cwd(), 'uploads', 'client-quarantine')
          : path.join(process.cwd(), 'uploads')
      );
      const relativeStorageKey = isQuarantined
        ? document.storageKey.slice('client-quarantine/'.length)
        : document.storageKey.slice('/uploads/'.length);
      const filePath = path.resolve(storageRoot, relativeStorageKey);
      const relativePath = path.relative(storageRoot, filePath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
      }

      try {
        const buffer = await fs.readFile(filePath);
        const safeFilename = document.filename.replace(/[^\w.-]/g, '_').slice(0, 255);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': document.mimeType,
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-cache',
          },
        });
      } catch {
        return NextResponse.json({ error: 'Fichier introuvable sur le disque' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Stockage non supportÃ©' }, { status: 500 });
  } catch (error) {
    logger.error('[DOWNLOAD] Erreur:', { error });
    return NextResponse.json({ error: 'Erreur lors du tÃ©lÃ©chargement' }, { status: 500 });
  }
}

