import { auth } from '@/lib/clerk-auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import { z } from 'zod';

const documentIdSchema = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

function rateLimitedResponse(reset: Date): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))) },
    }
  );
}

function resolveQuarantinePath(storageKey: string, tenantId: string, documentId: string): string | null {
  if (storageKey !== `client-quarantine/${tenantId}/${documentId}`) {
    return null;
  }

  const storageRoot =
    process.env.VAULT_STORAGE_ROOT ?? path.join(process.cwd(), 'uploads', 'client-quarantine');
  const tenantDirectory = path.resolve(storageRoot, tenantId);
  const filePath = path.resolve(tenantDirectory, documentId);
  return filePath.startsWith(tenantDirectory + path.sep) ? filePath : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await auth();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    if (user.role !== 'CLIENT' || !user.id || !user.tenantId || !user.clientId) {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const idResult = documentIdSchema.safeParse((await params).id);
    if (!idResult.success) {
      return NextResponse.json({ error: 'ID document invalide' }, { status: 400 });
    }

    const rateLimit = await checkRateLimit(
      `client-document-download:${user.id}:${getClientIP(request)}`,
      'default'
    );
    if (!rateLimit.success) {
      return rateLimitedResponse(rateLimit.reset);
    }

    const document = await prisma.document.findFirst({
      where: {
        id: idResult.data,
        tenantId: user.tenantId,
        OR: [{ clientId: user.clientId }, { Dossier: { clientId: user.clientId } }],
      },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        storageKey: true,
        antivirusStatus: true,
      },
    });
    if (!document) {
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }
    if (document.antivirusStatus !== 'CLEAN') {
      return NextResponse.json({ error: 'Document en cours de vérification' }, { status: 423 });
    }
    if (!ALLOWED_TYPES.has(document.mimeType)) {
      return NextResponse.json({ error: 'Type de document non autorisé' }, { status: 403 });
    }

    const filePath = resolveQuarantinePath(document.storageKey, user.tenantId, document.id);
    if (!filePath) {
      return NextResponse.json({ error: 'Stockage document indisponible' }, { status: 503 });
    }

    try {
      const { readFile } = await import('fs/promises');
      const fileBuffer = await readFile(filePath);
      const safeFilename = document.originalName
        .replace(/[^\w\s.-]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 255);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': document.mimeType,
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Cache-Control': 'private, no-cache',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      return NextResponse.json({ error: 'Fichier introuvable sur le disque' }, { status: 404 });
    }
  } catch {
    logger.error('[CLIENT_DOCUMENT_DOWNLOAD] Échec du téléchargement');
    return NextResponse.json({ error: 'Erreur serveur lors du téléchargement' }, { status: 500 });
  }
}
