import { randomUUID } from 'crypto';
import { z } from 'zod';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { logger } from '@/lib/logger';
import { getSecurePrisma } from '@/lib/prisma';
import {
  DocumentStorageUnavailableError,
  deleteDocumentObject,
  storeEncryptedDocument,
} from '@/lib/security/document-storage';
import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
]);
const STAFF_ROLES = new Set([
  'ADMIN',
  'AVOCAT',
  'ASSOCIE',
  'COLLABORATEUR',
  'SECRETAIRE',
  'COMPTABLE',
]);

const documentQuerySchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  dossierId: z.string().trim().min(1).max(100).optional(),
  clientId: z.string().trim().min(1).max(100).optional(),
});

const uploadMetadataSchema = z.object({
  dossierId: z.string().trim().min(1).max(100).optional(),
  clientId: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(100).optional(),
});

function sanitizeFileName(fileName: string): string {
  const sanitized = fileName
    .replace(/[\\/]/g, '_')
    .replace(/[^a-zA-Z0-9._()\- ]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return sanitized && sanitized !== '.' && sanitized !== '..' ? sanitized : 'document';
}

function clientDocumentScope(user: { role: string; clientId: string | null }) {
  if (user.role !== 'CLIENT') return {};
  if (!user.clientId) return null;
  return {
    OR: [{ clientId: user.clientId }, { Dossier: { clientId: user.clientId } }],
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSessionCompat();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!user.tenantId || (user.role !== 'CLIENT' && !STAFF_ROLES.has(user.role))) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }
    const prisma = await getSecurePrisma();

    const formData = await request.formData();
    const fileEntry = formData.get('file');
    const metadata = uploadMetadataSchema.safeParse({
      dossierId: formData.get('dossierId') || undefined,
      clientId: formData.get('clientId') || undefined,
      category: formData.get('category') || undefined,
    });

    if (!metadata.success || !(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Données de dépôt invalides' }, { status: 400 });
    }

    const file = fileEntry;
    if (
      file.size <= 0 ||
      file.size > MAX_FILE_SIZE ||
      !ALLOWED_TYPES.has(file.type)
    ) {
      return NextResponse.json({ error: 'Fichier invalide ou non autorisé' }, { status: 400 });
    }

    const { dossierId } = metadata.data;
    let clientId = metadata.data.clientId ?? null;

    if (user.role === 'CLIENT') {
      if (!user.clientId || !dossierId || (clientId && clientId !== user.clientId)) {
        return NextResponse.json({ error: 'Données de dépôt invalides' }, { status: 403 });
      }
      clientId = user.clientId;
    }

    if (dossierId) {
      const dossier = await prisma.dossier.findFirst({
        where: {
          id: dossierId,
          tenantId: user.tenantId,
          ...(clientId ? { clientId } : {}),
        },
        select: { id: true },
      });
      if (!dossier) {
        return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
      }
    } else if (user.role === 'CLIENT') {
      return NextResponse.json({ error: 'Dossier requis' }, { status: 400 });
    }

    if (clientId && user.role !== 'CLIENT') {
      const client = await prisma.client.findFirst({
        where: { id: clientId, tenantId: user.tenantId },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
      }
    }

    const documentId = randomUUID();
    const safeFileName = sanitizeFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    let storageKey: string;
    try {
      storageKey = await storeEncryptedDocument(
        user.tenantId,
        documentId,
        'documents',
        buffer
      );
    } catch (storageError) {
      if (storageError instanceof DocumentStorageUnavailableError) {
        return NextResponse.json({ error: 'Coffre-fort documentaire indisponible' }, { status: 503 });
      }
      throw storageError;
    }

    let document;
    try {
      document = await prisma.document.create({
        data: {
          id: documentId,
          tenantId: user.tenantId,
          dossierId: dossierId ?? null,
          clientId,
          filename: safeFileName,
          originalName: safeFileName,
          mimeType: file.type,
          size: buffer.length,
          storageKey,
          category: metadata.data.category ?? null,
          uploadedBy: user.id,
          ocrProcessed: false,
          aiAnalyzed: false,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      await deleteDocumentObject(storageKey);
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        status: 'awaiting-human-review',
      },
    });
  } catch (error) {
    logger.error(
      'Erreur upload document',
      new Error(error instanceof Error ? error.name : 'UnknownError')
    );
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSessionCompat();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (!user.tenantId) {
      return NextResponse.json({ error: 'Cabinet requis' }, { status: 403 });
    }
    const prisma = await getSecurePrisma();

    const parsedQuery = documentQuerySchema.safeParse({
      id: request.nextUrl.searchParams.get('id') ?? undefined,
      dossierId: request.nextUrl.searchParams.get('dossierId') ?? undefined,
      clientId: request.nextUrl.searchParams.get('clientId') ?? undefined,
    });
    if (!parsedQuery.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    const clientScope = clientDocumentScope(user);
    if (clientScope === null) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const { id, dossierId, clientId } = parsedQuery.data;
    if (user.role === 'CLIENT' && clientId && clientId !== user.clientId) {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const where = {
      tenantId: user.tenantId,
      ...(id ? { id } : {}),
      ...(dossierId ? { dossierId } : {}),
      ...(clientId ? { clientId } : {}),
      ...clientScope,
    };

    if (id) {
      const document = await prisma.document.findFirst({
        where,
        include: {
          Dossier: { select: { numero: true } },
          Client: { select: { firstName: true, lastName: true } },
          User: { select: { name: true, email: true } },
        },
      });
      if (!document) {
        return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
      }
      return NextResponse.json({ document });
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        Dossier: { select: { numero: true } },
        Client: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    logger.error('Erreur GET documents', new Error(error instanceof Error ? error.name : 'UnknownError'));
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
