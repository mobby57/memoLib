import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/documents/download/[id]
 * TÃ©lÃ©charge un document par son ID depuis la base de donnÃ©es
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const prisma = await getSecurePrisma();
  try {
    const session = await getServerSessionCompat();

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }

    const user = session.user as { tenantId?: string };
    const tenantId = user.tenantId;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID document requis' }, { status: 400 });
    }

    // Chercher le document en base de donnÃ©es
    const document = await prisma.document.findFirst({
      where: {
        id,
        dossier: {
          tenantId,
        },
      },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    // Si c'est une URL externe (Vercel Blob, S3, etc.) - rediriger
    if (document.url?.startsWith('http')) {
      return NextResponse.redirect(document.url);
    }

    // Si c'est un fichier local (dÃ©veloppement)
    if (document.url?.startsWith('/uploads/')) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');

        // ðŸ›¡ï¸ SÃ‰CURITÃ‰: Protection contre Path Traversal
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const requestedPath = path.normalize(document.url);

        // VÃ©rifier que le chemin ne contient pas de sÃ©quences dangereuses
        if (requestedPath.includes('..') || requestedPath.includes('%2e')) {
          logger.warn('[DOWNLOAD] Tentative de Path Traversal dÃ©tectÃ©e', {
            path: document.url,
            userId: session.user.id,
          });
          return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
        }

        // Construire le chemin absolu et vÃ©rifier qu'il reste dans uploads
        // Note: Pour la production, les fichiers doivent Ãªtre stockÃ©s dans le service cloud
        // En dÃ©veloppement uniquement: les fichiers sont dans le dossier uploads
        const baseDir = process.env.NODE_ENV === 'production' ? '/tmp' : process.cwd();
        const filePath = path.resolve(baseDir, requestedPath.replace(/^\//, ''));
        const normalizedUploadsDir = path.resolve(baseDir, uploadsDir);

        if (!filePath.startsWith(normalizedUploadsDir)) {
          logger.warn("[DOWNLOAD] Tentative d'accÃ¨s hors du dossier uploads", {
            requestedPath: filePath,
            allowedDir: normalizedUploadsDir,
            userId: session.user.id,
          });
          return NextResponse.json({ error: 'AccÃ¨s non autorisÃ©' }, { status: 403 });
        }

        // VÃ©rifier que le fichier existe
        try {
          await fs.access(filePath);
        } catch {
          return NextResponse.json({ error: 'Fichier non trouvÃ©' }, { status: 404 });
        }

        const fileBuffer = await fs.readFile(filePath);

        // DÃ©terminer le content-type
        const contentType = getContentType(document.name);

        // ðŸ›¡ï¸ SÃ‰CURITÃ‰: Nettoyer le nom de fichier pour Content-Disposition
        const safeFilename = document.name
          .replace(/[^\w\s.-]/g, '_') // Remplacer les caractÃ¨res spÃ©ciaux
          .replace(/\s+/g, '_') // Remplacer les espaces
          .slice(0, 255); // Limiter la longueur

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${safeFilename}"`,
            'Content-Length': String(fileBuffer.length),
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-cache',
          },
        });
      } catch (fsError) {
        logger.warn('[DOWNLOAD] Fichier local non trouvÃ©', { path: document.url, error: fsError });
        return NextResponse.json({ error: 'Fichier non trouvÃ© sur le serveur' }, { status: 404 });
      }
    }

    // Aucun stockage configurÃ©
    return NextResponse.json({
      message: 'Stockage fichiers non configurÃ©',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
      },
      suggestion: 'Configurez BLOB_READ_WRITE_TOKEN pour Vercel Blob (1GB gratuit)',
    });
  } catch (error) {
    logger.error('[DOWNLOAD] Erreur:', { error });
    return NextResponse.json({ error: 'Erreur lors du tÃ©lÃ©chargement' }, { status: 500 });
  }
}

/**
 * Retourne le content-type basÃ© sur l'extension du fichier
 */
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    txt: 'text/plain',
  };
  return types[ext || ''] || 'application/octet-stream';
}

