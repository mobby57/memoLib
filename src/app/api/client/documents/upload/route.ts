import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { logger } from '@/lib/logger';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const dossierId = formData.get('dossierId') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier la taille (max 10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 MB)' }, { status: 400 });
    }

    // Vérifier le type MIME
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
    }

    // Vérifier que le dossier appartient au client (si dossierId fourni)
    if (dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: {
          id: dossierId,
          clientId: userId,
        },
      });

      if (!dossier) {
        return NextResponse.json({ error: 'Dossier non trouvé ou accès refusé' }, { status: 404 });
      }
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const filename = `${randomUUID()}.${fileExtension}`;
    
    // Créer le chemin de stockage
    const uploadDir = join(process.cwd(), 'uploads', 'documents');
    const filePath = join(uploadDir, filename);

    // Convertir le fichier en Buffer et sauvegarder
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      // Si le dossier n'existe pas, le créer
      const { mkdir } = await import('fs/promises');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);
    }

    // Enregistrer dans la base de données
    const document = await prisma.document.create({
      data: {
        filename: filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: filePath,
        dossierId: dossierId || undefined,
      },
    });

    logger.info(`Client ${userId} a téléversé le document ${file.name}`);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        size: document.size,
      },
    });
  } catch (error) {
    logger.error('Erreur upload document client', { error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'upload' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
