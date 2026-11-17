/**
 * API Route - TÃ©lÃ©chargement SÃ©curisÃ© de Document
 * GET /api/lawyer/workspaces/[id]/documents/[docId]/download
 */

import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';;
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { NextRequest, NextResponse } from 'next/server';
import { isAbsolute, relative, resolve, sep } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session: any = await getServerSessionCompat();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifiÃ©' }, { status: 401 });
    }
    if (!session.user.tenantId) {
      return NextResponse.json({ error: 'Cabinet requis' }, { status: 403 });
    }

    const prisma = await getSecurePrisma();

    // RÃ©cupÃ©rer le document
    const document = await prisma.workspaceDocument.findFirst({
      where: { id: params.docId, workspaceId: params.id },
      include: {
        workspace: {
          select: {
            id: true,
            tenantId: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouvÃ©' }, { status: 404 });
    }

    // VÃ©rifier que le document appartient au workspace demandÃ©
    if (document.workspaceId !== params.id) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ©' }, { status: 403 });
    }

    // VÃ©rifier l'accÃ¨s au tenant
    const userTenantId = (session.user as any).tenantId;
    if (document.workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'AccÃ¨s refusÃ© - Tenant' }, { status: 403 });
    }

    const storageRoot = resolve(process.cwd(), 'private-uploads');
    const physicalPath = resolve(storageRoot, document.storagePath);
    const storageRelativePath = relative(storageRoot, physicalPath);
    if (
      storageRelativePath === '..' ||
      storageRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(storageRelativePath)
    ) {
      return NextResponse.json({ error: 'Chemin de document invalide' }, { status: 400 });
    }

    if (!existsSync(physicalPath)) {
      return NextResponse.json({ error: 'Fichier physique introuvable' }, { status: 404 });
    }

    const fileBuffer = await readFile(physicalPath);

    // DÃ©terminer le Content-Disposition (inline pour PDFs/images, attachment pour le reste)
    const isPreviewable = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(
      document.mimeType
    );

    const disposition = isPreviewable
      ? `inline; filename="${encodeURIComponent(document.originalName)}"`
      : `attachment; filename="${encodeURIComponent(document.originalName)}"`;

    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': disposition,
        'Content-Length': document.sizeBytes.toString(),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    logger.error('Erreur tÃ©lÃ©chargement document', error instanceof Error ? error : undefined, {
      route: '/api/lawyer/workspaces/[id]/documents/[docId]/download',
    });
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

