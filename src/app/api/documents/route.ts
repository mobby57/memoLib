import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { getServerSessionCompat } from '@/lib/auth/getServerSessionCompat';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
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
    const storageKey = `/uploads/documents/${user.tenantId}/${documentId}/${safeFileName}`;
    const filePath = path.join(process.cwd(), storageKey);
    const buffer = Buffer.from(await file.arrayBuffer());

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer, { flag: 'wx' });

    let document;
    try {
      document = await prisma.document.create({
        data: {
          id: documentId,
          tenantId: user.tenantId,
          dossierId: dossierId ?? null,
          clientId,
          filename: safeFileName,
          originalName: file.name,
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
      await unlink(filePath).catch(cleanupError => {
        logger.error(
          'Échec du nettoyage du fichier après erreur de base',
          new Error(cleanupError instanceof Error ? cleanupError.name : 'UnknownError')
        );
      });
      throw error;
    }

    processOCR(document.id, buffer, file.type).catch(error => {
      logger.error('Échec du traitement OCR asynchrone', error);
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.originalName,
        status: 'processing',
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

async function processOCR(documentId: string, buffer: Buffer, mimeType: string) {
  try {
    let extractedText = '';
    let confidence = 0;
    let extractedData: Record<string, unknown> = {};

    if (mimeType === 'application/pdf') {
      const result = await extractTextFromPDF(buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else if (mimeType.startsWith('image/')) {
      const result = await extractTextFromImage(buffer);
      extractedText = result.text;
      confidence = result.confidence;
    } else {
      extractedText = buffer.toString('utf-8');
      confidence = 1;
    }

    if (extractedText.length > 0) {
      extractedData = await analyzeDocumentContent(extractedText);
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrText: extractedText.substring(0, 50000),
        ocrConfidence: confidence,
        extractedData: JSON.stringify(extractedData),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Échec OCR document', new Error(error instanceof Error ? error.name : 'UnknownError'));
    await prisma.document.update({
      where: { id: documentId },
      data: {
        ocrProcessed: true,
        ocrConfidence: 0,
        extractedData: JSON.stringify({ error: 'Échec du traitement OCR' }),
        updatedAt: new Date(),
      },
    });
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  return {
    text: `[Contenu PDF extrait - ${buffer.length} bytes]`,
    confidence: 0.9,
  };
}

async function extractTextFromImage(buffer: Buffer): Promise<{ text: string; confidence: number }> {
  return {
    text: `[Texte OCR extrait - ${buffer.length} bytes]`,
    confidence: 0.85,
  };
}

async function analyzeDocumentContent(text: string): Promise<Record<string, unknown>> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2:latest',
        prompt: `Analyse ce document et extrait les informations cles au format JSON:
- type de document (facture, contrat, identite, courrier, etc.)
- dates mentionnees
- montants/sommes
- noms/personnes
- numeros de reference
- resume en 2 phrases

Document:
${text.substring(0, 3000)}

Reponds uniquement en JSON valide.`,
        stream: false,
      }),
    });

    if (!response.ok) return { analyzed: false };

    const data = (await response.json()) as { response?: string };
    const responseText = data.response ?? '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return { summary: responseText.substring(0, 500), analyzed: true };
  } catch (error) {
    logger.error(
      'Échec de l’analyse IA du document',
      new Error(error instanceof Error ? error.name : 'UnknownError')
    );
    return { analyzed: false, error: 'Analyse IA non disponible' };
  }
}
