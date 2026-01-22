/**
 * API Route - Téléchargement Sécurisé de Document
 * GET /api/lawyer/workspaces/[id]/documents/[docId]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le document
    const document = await prisma.workspaceDocument.findUnique({
      where: { id: params.docId },
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
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    // Vérifier que le document appartient au workspace demandé
    if (document.workspaceId !== params.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier l'accès au tenant
    const userTenantId = (session.user as any).tenantId;
    if (document.workspace.tenantId !== userTenantId) {
      return NextResponse.json({ error: 'Accès refusé - Tenant' }, { status: 403 });
    }

    // Lire le fichier physique
    const physicalPath = join(process.cwd(), 'public', document.storagePath);
    
    if (!existsSync(physicalPath)) {
      return NextResponse.json({ 
        error: 'Fichier physique introuvable',
        path: document.storagePath 
      }, { status: 404 });
    }

    const fileBuffer = await readFile(physicalPath);

    // Déterminer le Content-Disposition (inline pour PDFs/images, attachment pour le reste)
    const isPreviewable = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ].includes(document.mimeType);

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
        'Cache-Control': 'private, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Erreur téléchargement document:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
