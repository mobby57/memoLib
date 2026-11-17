import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { findActiveClientDossierGrant } from '@/lib/client-access';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { withTenantContextBatch } from '@/lib/prisma';
import { scanDocumentAsync } from '@/lib/security/antivirus';

const intakeSchema = z.object({
  dossierId: z.string().trim().min(1).max(100),
  originalLang: z.enum(['fr', 'ar']),
  answers: z.object({
    q1: z.string().trim().min(1).max(5000),
    q2: z.string().trim().min(1).max(5000),
  }).strict(),
}).strict();

export const runtime = 'nodejs';

async function translateToFrench(text: string, sourceLang: string): Promise<string> {
  if (sourceLang === 'fr') return text;
  return `[Traduit de ${sourceLang.toUpperCase()}] : ${text}`;
}

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(clerkUserId);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de demandes. Réessayez plus tard.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  const parsed = intakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { dossierId, originalLang, answers } = parsed.data;
  const access = await findActiveClientDossierGrant(clerkUserId, dossierId);
  if (!access) {
    return NextResponse.json({ error: 'Accès refusé à ce dossier' }, { status: 403 });
  }

  const intake = {
    originalLang,
    original: answers,
    translated: {
      q1: await translateToFrench(answers.q1, originalLang),
      q2: await translateToFrench(answers.q2, originalLang),
    },
  };
  const buffer = Buffer.from(JSON.stringify(intake), 'utf8');
  const documentId = randomUUID();
  const filename = `${documentId}.json`;
  const directory = join(process.cwd(), 'uploads', 'client-intake', access.grant.tenantId);
  const filePath = join(directory, filename);
  const storageKey = `/uploads/client-intake/${access.grant.tenantId}/${filename}`;

  let fileWritten = false;
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(filePath, buffer, { flag: 'wx' });
    fileWritten = true;

    await withTenantContextBatch(access.grant.tenantId, transaction => [
      transaction.document.create({
        data: {
          id: documentId,
          tenantId: access.grant.tenantId,
          dossierId,
          filename,
          originalName: `Formulaire d'admission (${originalLang.toUpperCase()}).json`,
          mimeType: 'application/json',
          size: buffer.byteLength,
          storageKey,
          category: 'client-intake',
          description: "Réponses au formulaire d'admission client",
          uploadedBy: access.user.id,
          antivirusStatus: 'PENDING',
          updatedAt: new Date(),
        },
      }),
    ]);
  } catch (error) {
    if (fileWritten) {
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        logger.error('Échec du nettoyage du formulaire client', {
          documentId,
          error: cleanupError instanceof Error ? cleanupError.name : 'UnknownError',
        });
      }
    }

    logger.error('Échec de sauvegarde du formulaire client', {
      documentId,
      error: error instanceof Error ? error.name : 'UnknownError',
    });
    return NextResponse.json({ error: 'Impossible d’enregistrer le formulaire' }, { status: 500 });
  }

  void scanDocumentAsync({
    documentId,
    tenantId: access.grant.tenantId,
    mimeType: 'application/json',
    buffer,
  }).catch(error => {
    logger.error('Échec de l’analyse antivirus du formulaire client', {
      documentId,
      error: error instanceof Error ? error.name : 'UnknownError',
    });
  });

  return NextResponse.json({ success: true, documentId }, { status: 201 });
}
