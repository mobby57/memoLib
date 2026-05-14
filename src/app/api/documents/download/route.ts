import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents/download?id=xxx
 * Returns a signed download URL for a private Vercel Blob document,
 * or streams the file from local storage.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const documentId = request.nextUrl.searchParams.get('id');
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID requis' }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, tenantId },
      select: {
        id: true,
        storageKey: true,
        filename: true,
        mimeType: true,
        antivirusStatus: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    if (document.antivirusStatus === 'INFECTED') {
      return NextResponse.json({ error: 'Document bloqué par l\'antivirus' }, { status: 403 });
    }

    // Vercel Blob private URL → generate signed download URL
    if (
      process.env.BLOB_READ_WRITE_TOKEN &&
      document.storageKey.startsWith('https://')
    ) {
      try {
        const { getDownloadUrl } = await import('@vercel/blob');
        const downloadUrl = await getDownloadUrl(document.storageKey);
        return NextResponse.json({ url: downloadUrl, filename: document.filename });
      } catch (blobError) {
        logger.warn('[DOWNLOAD] Vercel Blob signed URL failed', { error: blobError });
      }
    }

    // Local file fallback — stream the file
    if (document.storageKey.startsWith('/uploads/')) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), document.storageKey);

      try {
        const buffer = await fs.readFile(filePath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': document.mimeType,
            'Content-Disposition': `attachment; filename="${document.filename}"`,
            'Cache-Control': 'private, no-cache',
          },
        });
      } catch {
        return NextResponse.json({ error: 'Fichier introuvable sur le disque' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Stockage non supporté' }, { status: 500 });
  } catch (error) {
    logger.error('[DOWNLOAD] Erreur:', { error });
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}
