import { prisma } from '@/lib/prisma';

export interface PendingActionDecision {
  createCase?: boolean;
  caseTitle?: string;
  createClient?: boolean;
  clientName?: string;
  linkToClientId?: string;
  assignToUserId?: string;
  priority?: number;
  tags?: string[];
  notes?: string;
}

function splitName(fullName?: string): { firstName: string; lastName: string } {
  const normalized = (fullName || '').trim();
  if (!normalized) {
    return { firstName: 'Nouveau', lastName: 'Client' };
  }

  const chunks = normalized.split(/\s+/);
  if (chunks.length === 1) {
    return { firstName: chunks[0], lastName: 'Client' };
  }

  return {
    firstName: chunks[0],
    lastName: chunks.slice(1).join(' '),
  };
}

function buildDossierNumber(seed: number): string {
  return `DOS-${new Date().getFullYear()}-${String(seed).padStart(5, '0')}`;
}

export async function approvePendingAction(
  actionId: string,
  tenantId: string,
  decision: PendingActionDecision
) {
  const email = await prisma.email.findFirst({
    where: {
      id: actionId,
      tenantId,
      isProcessed: false,
    },
  });

  if (!email) {
    return null;
  }

  return prisma.$transaction(async transaction => {
    let clientId = decision.linkToClientId || email.clientId || null;

    if (!clientId && decision.createClient) {
      const inferredName = splitName(decision.clientName || email.from.split('@')[0]);
      const createdClient = await transaction.client.create({
        data: {
          tenantId,
          firstName: inferredName.firstName,
          lastName: inferredName.lastName,
          email: email.from,
          phone: null,
        },
      });
      clientId = createdClient.id;
    }

    let dossierId = email.dossierId || null;

    if (!dossierId && decision.createCase && clientId) {
      const currentCount = await transaction.dossier.count({
        where: { tenantId },
      });

      const createdDossier = await transaction.dossier.create({
        data: {
          tenantId,
          clientId,
          numero: buildDossierNumber(currentCount + 1),
          typeDossier: 'general',
          objet: decision.caseTitle || email.subject,
          statut: 'en_cours',
          priorite:
            decision.priority && decision.priority >= 4
              ? 'haute'
              : decision.priority && decision.priority <= 2
                ? 'basse'
                : 'normale',
        },
      });

      dossierId = createdDossier.id;
    }

    const mergedTags = [
      ...(email.tags ? email.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []),
      ...(decision.tags || []),
    ];

    const updatedEmail = await transaction.email.update({
      where: { id: email.id },
      data: {
        isProcessed: true,
        processedAt: new Date(),
        clientId,
        dossierId,
        tags: mergedTags.length > 0 ? Array.from(new Set(mergedTags)).join(',') : email.tags,
        aiAnalysis: decision.notes || email.aiAnalysis,
      },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        dossierId: true,
        isProcessed: true,
        processedAt: true,
      },
    });

    return updatedEmail;
  });
}

export async function rejectPendingAction(
  actionId: string,
  tenantId: string,
  reason: string,
  markAsSpam: boolean,
  archive: boolean
) {
  const email = await prisma.email.findFirst({
    where: {
      id: actionId,
      tenantId,
      isProcessed: false,
    },
  });

  if (!email) {
    return null;
  }

  const tags = [
    ...(email.tags ? email.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []),
    markAsSpam ? 'spam' : 'rejected',
    reason ? `reason:${reason}` : null,
  ].filter((item): item is string => Boolean(item));

  return prisma.email.update({
    where: { id: actionId },
    data: {
      isProcessed: true,
      processedAt: new Date(),
      isArchived: archive,
      tags: Array.from(new Set(tags)).join(','),
    },
    select: {
      id: true,
      isProcessed: true,
      isArchived: true,
      processedAt: true,
      tags: true,
    },
  });
}
