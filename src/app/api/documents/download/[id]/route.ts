import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * GET /api/documents/download/[id]
 * Telecharge un document par son ID depuis la base de donnees
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
                
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as { tenantId?: string };
    const tenantId = user.tenantId;
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID document requis' }, { status: 400 });
    }

    // Chercher le document en base de donnees
    const document = await prisma.document.findFirst({
      where: {
        id,
        dossier: {
          tenantId
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        size: true,
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    // Si c'est une URL externe (Vercel Blob, S3, etc.)
    if (document.url?.startsWith('http')) {
      return NextResponse.redirect(document.url);
    }

    // Pour l'instant, retourner les metadonnees
    // TODO: Integrer Vercel Blob  autegatuit
    return NextResponse.json({
      message: 'Stockage fichiers non configure',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
      },
      suggestion: 'Configurez BLOB_READ_WRITE_TOKEN pour Vercel Blob (1GB gratuit)
    logger.error('[DOWNLOAD] Erreur:', { error });
    return NextResponse.json(
      { error: 'Erreur lors du telechargement' },
      { status: 500 }
    );
  }
}
