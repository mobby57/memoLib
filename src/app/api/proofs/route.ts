import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// GET - Liste des preuves
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const dossierId = searchParams.get('dossierId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    const where: Record<string, unknown> = { tenantId };
    if (dossierId) where.dossierId = dossierId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [proofs, total] = await Promise.all([
      prisma.proof.findMany({
        where,
        include: {
          dossier: { select: { numero: true } },
          document: { select: { filename: true } },
        },
        orderBy: { proofDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.proof.count({ where }),
    ]);

    return NextResponse.json({ proofs, total, hasMore: offset + proofs.length < total });
  } catch (error) {
    logger.error('Erreur GET proofs', error instanceof Error ? error : undefined, {
      route: '/api/proofs',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une preuve
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      type,
      title,
      description,
      dossierId,
      clientId,
      documentId,
      informationUnitId,
      fileStorageKey,
      fileBuffer,
      fileMimeType,
      fileSize,
      proofDate,
      capturedBy,
      metadata,
    } = body;

    if (!tenantId || !type || !title || !proofDate || !capturedBy) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    const proofDateParsed = new Date(proofDate);
    if (isNaN(proofDateParsed.getTime())) {
      return NextResponse.json({ error: 'Format proofDate invalide' }, { status: 400 });
    }

    // Calcul du hash si fichier fourni
    let fileHash = null;
    if (fileBuffer) {
      fileHash = crypto
        .createHash('sha256')
        .update(Buffer.from(fileBuffer, 'base64'))
        .digest('hex');
    }

    // Récupérer la dernière preuve pour la chaîne
    const lastProof = await prisma.proof.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    // Calcul du timestamp hash
    const timestampData = `${type}|${title}|${proofDate}|${capturedBy}|${lastProof?.id || ''}`;
    const timestampHash = crypto.createHash('sha256').update(timestampData).digest('hex');

    const proof = await prisma.proof.create({
      data: {
        tenantId,
        type,
        title,
        description,
        dossierId,
        clientId,
        documentId,
        informationUnitId,
        fileStorageKey,
        fileHash,
        fileMimeType,
        fileSize,
        proofDate: proofDateParsed,
        capturedBy,
        timestampHash,
        chainPreviousId: lastProof?.id || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, proof });
  } catch (error) {
    logger.error('Erreur POST proof', error instanceof Error ? error : undefined, {
      route: '/api/proofs',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Valider/Rejeter une preuve
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { proofId, status, validatedBy, rejectionReason } = body;

    if (!proofId || !status || !validatedBy) {
      return NextResponse.json({ error: 'proofId, status et validatedBy requis' }, { status: 400 });
    }

    const existing = await prisma.proof.findUnique({ where: { id: proofId } });
    if (!existing) {
      return NextResponse.json({ error: 'Preuve non trouvée' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === 'VALIDATED') {
      updateData.validatedBy = validatedBy;
      updateData.validatedAt = new Date();
    } else if (status === 'REJECTED') {
      updateData.validatedBy = validatedBy;
      updateData.validatedAt = new Date();
      updateData.rejectionReason = rejectionReason;
    }

    const proof = await prisma.proof.update({
      where: { id: proofId },
      data: updateData,
    });

    return NextResponse.json({ success: true, proof });
  } catch (error) {
    logger.error('Erreur PATCH proof', error instanceof Error ? error : undefined, {
      route: '/api/proofs',
    });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
