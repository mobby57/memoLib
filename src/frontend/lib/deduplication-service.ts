import * as db from '@/lib/db';
import crypto from 'crypto';

/**
 * Déduplication service pour les messages multi-canal
 * Utilise le checksum SHA-256 pour détecter les doublons
 * Version in-memory (sans PostgreSQL)
 */

export async function computeChecksum(payload: any): Promise<string> {
  const data = JSON.stringify(payload);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Vérifie si un message a déjà été traité (duplicate)
 */
export async function checkDuplicate(checksum: string): Promise<boolean> {
  return await db.checkDuplicate(checksum);
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

  // Stocker avec db.ts in-memory
  const id = await db.storeChannelMessage({
    channel: data.channel,
    external_id: data.externalId,
    checksum: data.checksum,
    sender_email: data.sender.email,
    sender_phone: data.sender.phone,
    subject: data.subject,
    body: data.body,
  });

  // Retourner un objet compatible avec l'API attendue
  return {
    id: id!,
    externalId: data.externalId,
    checksum: data.checksum,
    channel: data.channel,
    status: 'RECEIVED',
    receivedAt: new Date(),
  };
}
