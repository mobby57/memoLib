import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Déduplication service pour les messages multi-canal
 * Utilise le checksum SHA-256 pour détecter les doublons
 */

export async function computeChecksum(payload: any): Promise<string> {
  const data = JSON.stringify(payload);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Vérifie si un message a déjà été traité (duplicate)
 */
export async function checkDuplicate(checksum: string): Promise<boolean> {
  const existing = await prisma.channelMessage.findUnique({
    where: { checksum },
  });
  return !!existing;
}

/**
 * Enregistre un message avec vérification de duplicate
 */
export async function storeChannelMessage(data: {
  externalId?: string;
  checksum: string;
  channel: string;
  sender: { email?: string; phone?: string; name?: string };
  body: string;
  subject?: string;
  channelMetadata?: Record<string, any>;
}) {
  // Vérifier le duplicate
  const isDuplicate = await checkDuplicate(data.checksum);
  if (isDuplicate) {
    throw new Error('DUPLICATE: Ce message a déjà été traité');
  }

  // Créer le message
  const message = await prisma.channelMessage.create({
    data: {
      externalId: data.externalId,
      checksum: data.checksum,
      channel: (data.channel?.toUpperCase() as any) || 'EMAIL',
      senderData: data.sender,
      body: data.body,
      subject: data.subject,
      channelMetadata: data.channelMetadata || {},
      status: 'RECEIVED',
    },
  });

  return message;
}
