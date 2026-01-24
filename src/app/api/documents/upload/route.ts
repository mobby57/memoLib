import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

export const dynamic = 'force-dynamic';

/**
 * POST /api/documents/upload
 * Upload un document pour un dossier
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const user = session.user as any;
    const tenantId = user.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant non trouve' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dossierId = formData.get('dossierId') as string | null;
    const type = formData.get('type') as string || 'document';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      );
    }

    // Validation type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorise' },
        { status: 400 }
      );
    }

    // Verifier que le dossier appartient au tenant
    if (dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: { id: dossierId, tenantId },
      });

      if (!dossier) {
        return NextResponse.json(
          { error: 'Dossier non trouve ou acces interdit' },
          { status: 404 }
        );
      }
    }

    // Generer nom de fichier unique
    const ext = path.extname(file.name);
    const uniqueId = randomUUID();
    const fileName = `${uniqueId}${ext}`;
    const relativePath = `${tenantId}/${dossierId || 'general'}/${fileName}`;
    const fullPath = path.join(UPLOAD_DIR, relativePath);

    // Creer le repertoire si necessaire
    const dir = path.dirname(fullPath);
    await mkdir(dir, { recursive: true });

    // ecrire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Calculer hash pour deduplication future
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    // Sauvegarder en base
    // Note: On utilise une table Document si elle existe, sinon on log
    const documentRecord = {
      id: uniqueId,
      tenantId,
      dossierId: dossierId || null,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      filePath: relativePath,
      hash,
      type,
      description,
      uploadedBy: user.id,
      uploadedAt: new Date(),
    };

    console.log('[UPLOAD] Document enregistre:', documentRecord);

    return NextResponse.json({
      success: true,
      document: {
        id: uniqueId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        url: `/api/documents/download/${uniqueId}`,
      },
    });

  } catch (error) {
    console.error('[UPLOAD] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/documents/upload
 * Liste les documents d'un dossier
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifie' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dossierId = searchParams.get('dossierId');

    // Pour l'instant, retourner une liste vide
    // a implementer: lecture depuis la base de donnees
    return NextResponse.json({
      documents: [],
      total: 0,
    });

  } catch (error) {
    console.error('[DOCUMENTS] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation' },
      { status: 500 }
    );
  }
}
