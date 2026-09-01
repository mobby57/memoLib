import { auth } from '@/lib/clerk-auth';
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
// CLERK-MIGRATION: Remplacement user -> user (vérifier)
// CLERK-MIGRATION: Remplacement auth() -> auth()
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/documents/download?id=xxx
 * Returns a signed download URL for a private Vercel Blob document,
 * or streams the file from local storage.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const tenantId = user.tenantId;
    const clientId = user.clientId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouvé' }, { status: 403 });
    }

    const documentId = request.nextUrl.searchParams.get('id');
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID requis' }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        tenantId,
        ...(user.role === 'CLIENT'
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
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    if (document.antivirusStatus === 'INFECTED') {
      return NextResponse.json({ error: 'Document bloqué par l’antivirus' }, { status: 403 });
    }

    if (user.role === 'CLIENT' && document.antivirusStatus !== 'CLEAN') {
      return NextResponse.json({ error: 'Document en cours de vérification' }, { status: 423 });
    }

    // Local file fallback — stream the file
    if (
      document.storageKey.startsWith('/uploads/') ||
      document.storageKey.startsWith('client-quarantine/')
    ) {
      const fs = await import('fs/promises');
      const path = await import('path');
      const filePath = document.storageKey.startsWith('client-quarantine/')
        ? path.join(
            /*turbopackIgnore: true*/ process.env.VAULT_STORAGE_ROOT ??
              path.join(process.cwd(), 'uploads', 'client-quarantine'),
            ...document.storageKey.split('/').slice(1)
          )
        : path.join(/*turbopackIgnore: true*/ process.cwd(), document.storageKey);

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




