import { auth } from '@/lib/clerk-auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// GET download document for admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await auth();
    const session = user ? { user } : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const documentId = params.id;

    // Get document with tenant check
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        dossier: {
          client: {
            tenantId: user.tenantId,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    // Read file
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, document.path);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Fichier non trouve sur le serveur' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.originalName}"`,
        'Content-Length': document.size.toString(),
      },
    });
  } catch (error) {
    logger.error('Error downloading admin document:', { error });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
