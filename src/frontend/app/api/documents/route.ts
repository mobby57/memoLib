/**
 * POST /api/documents/upload - Upload + OCR
 * GET /api/documents/search - Recherche full-text
 * Phase 7: Document OCR
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { DocumentOCRService } from '@/lib/services/document-ocr.service';

const prisma = new PrismaClient();
const documentOCRService = new DocumentOCRService(prisma);

// POST /api/documents/upload - Upload document + trigger OCR
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      dossierId,
      clientId,
      filename,
      mimeType,
      size,
      storageKey,
      uploadedBy,
      category,
    } = body;

    // Validation
    if (!tenantId || !filename || !mimeType || !uploadedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Créer document en DB
    const document = await prisma.document.create({
      data: {
        tenantId,
        dossierId,
        clientId,
        filename,
        originalName: filename,
        mimeType,
        size: size || 0,
        storageKey: storageKey || `documents/${Date.now()}-${filename}`,
        category,
        uploadedBy,
      },
    });

    // Trigger OCR (simulation avec buffer vide pour demo)
    const ocrResult = await documentOCRService.processDocument({
      documentId: document.id,
      tenantId,
      mimeType,
    });

    // Récupérer document mis à jour
    const updatedDocument = await prisma.document.findUnique({
      where: { id: document.id },
      include: {
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      ocr: {
        processed: true,
        confidence: ocrResult.confidence,
        textLength: ocrResult.text.length,
        wordCount: ocrResult.wordCount,
        entities: ocrResult.entities,
      },
    });
  } catch (error: any) {
    console.error('[API] POST /api/documents/upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET /api/documents/search?query=xxx&tenantId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('dossierId') || undefined;
    const category = searchParams.get('category') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!tenantId || !query) {
      return NextResponse.json({ error: 'Missing tenantId or query' }, { status: 400 });
    }

    const result = await documentOCRService.searchDocuments(tenantId, {
      query,
      dossierId,
      category,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] GET /api/documents/search error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
