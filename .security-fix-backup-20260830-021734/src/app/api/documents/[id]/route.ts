import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { canAccessDossier } from '@/lib/auth/dossier-access';
import { getBlobServiceClient } from '@/lib/azure/clients';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifie' },
        { status: 401 }
      );
    }

    const user = session.user as {
      id?: string;
      tenantId?: string;
      role?: string;
      groups?: string[];
    };

    if (!user.id || !user.tenantId) {
      return NextResponse.json(
        { error: 'Acces interdit' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID document requis' },
        { status: 400 }
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        dossierId: true,
        storageKey: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouve' },
        { status: 404 }
      );
    }

    if (document.dossierId) {
      const access = await canAccessDossier({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        groups: user.groups,
        dossierId: document.dossierId,
        action: 'read',
      });

      if (!access.allowed) {
        return NextResponse.json(
          { error: 'Document non trouve' },
          { status: 404 }
        );
      }
    } else if (user.role === 'CLIENT') {
      return NextResponse.json(
        { error: 'Acces interdit' },
        { status: 403 }
      );
    }

    try {
      if (document.storageKey.startsWith('azure://')) {
        const storagePath = document.storageKey.slice('azure://'.length);
        const [container, ...blobParts] = storagePath.split('/');
        const blobName = blobParts.join('/');

        if (container && blobName) {
          await getBlobServiceClient()
            .getContainerClient(container)
            .getBlockBlobClient(blobName)
            .deleteIfExists();
        }
      } else if (document.storageKey.startsWith('/uploads/')) {
        const fs = await import('fs/promises');
        const path = await import('path');

        const uploadsDir = path.resolve(process.cwd(), 'uploads');
        const relativePath = document.storageKey.replace(/^\/uploads\//, '');

        if (
          relativePath.includes('..') ||
          relativePath.includes('%2e')
        ) {
          return NextResponse.json(
            { error: 'Chemin invalide' },
            { status: 400 }
          );
        }

        const filePath = path.resolve(uploadsDir, relativePath);

        if (!filePath.startsWith(uploadsDir + path.sep)) {
          return NextResponse.json(
            { error: 'Chemin invalide' },
            { status: 400 }
          );
        }

        await fs.unlink(filePath).catch(() => {});
      }
    } catch (storageError) {
      logger.warn('[DOCUMENT DELETE] Erreur suppression stockage', {
        documentId: id,
        error: storageError,
      });
    }

    await prisma.document.delete({
      where: {
        id: document.id,
      },
    });

    logger.info('[DOCUMENT DELETE] Document supprime', {
      documentId: document.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      id: document.id,
    });
  } catch (error) {
    logger.error('[DOCUMENT DELETE] Erreur:', { error });

    return NextResponse.json(
      { error: 'Erreur lors de la suppression du document' },
      { status: 500 }
    );
  }
}
