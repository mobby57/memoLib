import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/lawyer/workspaces/[id]/documents
 * Liste les documents d'un workspace avec filtres
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';

    // Récupérer workspace avec documents
    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      include: {
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace non trouvé' }, { status: 404 });
    }

    // Filtrer documents
    let documents = workspace.documents;

    if (filter === 'verified') {
      documents = documents.filter(d => d.verified);
    } else if (filter === 'unverified') {
      documents = documents.filter(d => !d.verified);
    } else if (filter === 'ai_processed') {
      documents = documents.filter(d => d.aiProcessed);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(d =>
        d.originalName.toLowerCase().includes(searchLower) ||
        d.documentType.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Erreur GET documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lawyer/workspaces/[id]/documents
 * Upload nouveau document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string || undefined;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    // Validation taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10MB)' }, { status: 400 });
    }

    // Validation type MIME
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
    }

    // Préparer le stockage physique
    const filename = `${Date.now()}-${file.name}`;
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'workspaces', params.id);
    const storagePath = `/uploads/workspaces/${params.id}/${filename}`;

    // Créer dossier uploads si inexistant
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Sauvegarder fichier physiquement
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadsDir, filename), fileBuffer);

    // Créer document dans la base
    const document = await prisma.workspaceDocument.create({
      data: {
        tenantId: (session.user as any).tenantId,
        workspaceId: params.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath,
        documentType: documentType || 'other',
        description,
        aiProcessed: false,
        verified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploadé avec succès',
      document,
    });
  } catch (error) {
    console.error('Erreur POST documents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
