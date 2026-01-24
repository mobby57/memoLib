import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Acces reserve aux clients' }, { status: 403 });
    }

    const documentId = params.id;

    // Verifier que le document appartient au client
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { uploadedBy: userId },
          {
            dossier: {
              clientId: userId,
            },
          },
        ],
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document non trouve ou acces refuse' },
        { status: 404 }
      );
    }

    // Lire le fichier
    const fileBuffer = await readFile(document.path);

    logger.info(`Client ${userId} a telecharge le document ${document.originalName}`);

    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.originalName)}"`,
        'Content-Length': document.size.toString(),
      },
    });
  } catch (error) {
    logger.error('Erreur telechargement document client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors du telechargement' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
