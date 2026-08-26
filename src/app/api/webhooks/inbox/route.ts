import { prisma } from '@/lib/prisma';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const inboxPayloadSchema = z.object({
  to: z.string().trim().min(1).max(320),
  from: z.string().trim().min(1).max(320),
  subject: z.string().trim().max(998).default(''),
  body: z.string().max(1_000_000).optional(),
  attachments: z.array(z.object({ name: z.string().trim().max(255) }).passthrough()).default([]),
});

function safeEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

/**
 * POST /api/webhooks/inbox
 * Recoit les emails envoyes a [dossier]@inbox.memolib.space.
 * The sender signs the raw request and supplies an immutable delivery ID.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.INBOX_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Service webhook indisponible' }, { status: 503 });
  }

  const eventId = req.headers.get('x-webhook-id');
  if (!eventId || eventId.length > 255) {
    return NextResponse.json({ error: 'Identifiant d’événement requis' }, { status: 400 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature');
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  if (!signature || !safeEqual(signature, `sha256=${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
  }

  const payload = inboxPayloadSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { inboxEmail: payload.data.to },
    select: { id: true, tenantId: true },
  });
  if (!dossier) {
    return NextResponse.json({ error: 'Dossier non trouvé pour cet email' }, { status: 404 });
  }

  const checksum = createHash('sha256').update(`${dossier.id}:${eventId}`, 'utf8').digest('hex');
  const checklistItems = await prisma.dossierChecklistItem.findMany({
    where: { dossierId: dossier.id, tenantId: dossier.tenantId },
  });
  const matchedItem = matchDocumentToChecklist(
    payload.data.subject,
    payload.data.attachments,
    checklistItems
  );

  try {
    const result = await prisma.$transaction(async tx => {
      // ChannelMessage.checksum is unique and is the canonical durable
      // idempotency boundary shared with the multichannel webhook pipeline.
      await tx.channelMessage.create({
        data: {
          id: randomUUID(),
          tenantId: dossier.tenantId,
          externalId: eventId,
          checksum,
          channel: 'EMAIL',
          direction: 'INBOUND',
          status: 'PROCESSED',
          senderData: { from: payload.data.from },
          recipientData: { to: payload.data.to },
          subject: payload.data.subject || null,
          body: '',
          channelMetadata: { source: 'inbox-webhook' },
          consentStatus: 'PENDING',
          auditTrail: [],
          dossierId: dossier.id,
        },
      });

      if (!matchedItem) {
        await tx.auditLog.create({
          data: {
            id: randomUUID(),
            tenantId: dossier.tenantId,
            userId: 'SYSTEM',
            userEmail: 'system@memolib.local',
            userRole: 'SYSTEM',
            action: 'UPDATE',
            entityType: 'INBOX_WEBHOOK',
            entityId: eventId,
            details: { matched: false, dossierId: dossier.id },
          },
        });
        return { matched: null, received: 0, total: checklistItems.length, complete: false };
      }

      await tx.dossierChecklistItem.update({
        where: { id: matchedItem.id },
        data: {
          status: 'received',
          receivedAt: new Date(),
          receivedVia: 'email',
        },
      });

      const allItems = await tx.dossierChecklistItem.findMany({
        where: { dossierId: dossier.id, tenantId: dossier.tenantId },
      });
      const received = allItems.filter(item => item.status === 'received' || item.status === 'validated').length;
      const requiredItems = allItems.filter(item => item.required);
      const complete =
        requiredItems.length > 0 &&
        requiredItems.every(item => item.status === 'received' || item.status === 'validated');

      await tx.dossier.update({
        where: { id: dossier.id },
        data: { checklistReceived: received, checklistComplete: complete },
      });
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: dossier.tenantId,
          userId: 'SYSTEM',
          userEmail: 'system@memolib.local',
          userRole: 'SYSTEM',
          action: 'UPDATE',
          entityType: 'DOSSIER_CHECKLIST',
          entityId: matchedItem.id,
          details: { source: 'inbox-webhook', dossierId: dossier.id, eventId },
        },
      });

      return { matched: matchedItem.label, received, total: allItems.length, complete };
    });

    return NextResponse.json({
      success: true,
      matched: result.matched,
      progress: `${result.received}/${result.total}`,
      complete: result.complete,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ success: true, duplicate: true });
    }
    throw error;
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function matchDocumentToChecklist(
  subject: string,
  attachments: Array<{ name: string }>,
  items: Array<{ id: string; label: string; status: string }>
): { id: string; label: string } | null {
  const combined = `${subject} ${attachments.map(attachment => attachment.name).join(' ')}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    passeport: ['passeport', 'passport', 'identite', 'id card'],
    domicile: ['domicile', 'edf', 'electricite', 'quittance', 'loyer', 'hebergement'],
    paie: ['paie', 'salaire', 'bulletin', 'fiche de paie'],
    travail: ['contrat', 'travail', 'employeur', 'attestation employeur', 'cdi', 'cdd'],
    imposition: ['imposition', 'impot', 'avis', 'fiscal'],
    scolarite: ['scolarite', 'ecole', 'college', 'lycee', 'inscription'],
    medical: ['medical', 'medecin', 'certificat medical', 'sante'],
    naissance: ['naissance', 'acte de naissance', 'birth'],
    mariage: ['mariage', 'acte de mariage'],
    photo: ['photo', 'identite', 'portrait'],
    oqtf: ['oqtf', 'obligation', 'quitter'],
    recit: ['recit', 'vie', 'histoire', 'persecution'],
    timbre: ['timbre', 'fiscal'],
    assurance: ['assurance', 'maladie', 'securite sociale', 'cpam'],
    casier: ['casier', 'judiciaire', 'criminal'],
    diplome: ['diplome', 'b1', 'francais', 'delf', 'tcf'],
  };

  for (const item of items.filter(candidate => candidate.status === 'missing')) {
    const itemLabel = item.label.toLowerCase();
    if (
      Object.values(keywords).some(
        terms => terms.some(term => itemLabel.includes(term)) && terms.some(term => combined.includes(term))
      )
    ) {
      return item;
    }
  }

  return null;
}
