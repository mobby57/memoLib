/**
 * Service de chiffrement at-rest des emails.
 * 
 * OBLIGATION LÉGALE:
 * - Art. 66-5 Loi 71-1130 (secret professionnel)
 * - RGPD Art. 32 (mesures techniques de sécurité)
 * 
 * Stratégie de migration progressive:
 * 1. Nouveaux emails → chiffrés dans bodyEncrypted, body contient "[ENCRYPTED]"
 * 2. Lecture → tente bodyEncrypted, fallback sur body si non chiffré
 * 3. Migration batch des anciens emails (script séparé)
 * 
 * IMPORTANT: ENCRYPTION_MASTER_KEY doit être configuré en production.
 * Sans cette clé, le chiffrement est désactivé (mode dégradé dev).
 */

import { encryptData, decryptData, EncryptedDataPayload } from '@/lib/security/encryption';
import { logger } from '@/lib/logger';

const ENCRYPTED_PLACEHOLDER = '[ENCRYPTED]';

function isEncryptionEnabled(): boolean {
  return Boolean(process.env.ENCRYPTION_MASTER_KEY);
}

/**
 * Chiffre le contenu d'un email avant stockage en BDD.
 * Retourne les champs à stocker dans Prisma.
 */
export function encryptEmailBody(body: string, htmlBody?: string | null): {
  body: string;
  bodyEncrypted: string | null;
  htmlBody: string | null;
  htmlBodyEncrypted: string | null;
} {
  if (!isEncryptionEnabled()) {
    // Mode dev sans clé — stockage en clair
    return { body, bodyEncrypted: null, htmlBody: htmlBody || null, htmlBodyEncrypted: null };
  }

  try {
    const encryptedBody = encryptData(body);
    const encryptedHtml = htmlBody ? encryptData(htmlBody) : null;

    return {
      body: ENCRYPTED_PLACEHOLDER, // Le champ body ne contient plus le texte en clair
      bodyEncrypted: JSON.stringify(encryptedBody),
      htmlBody: htmlBody ? ENCRYPTED_PLACEHOLDER : null,
      htmlBodyEncrypted: encryptedHtml ? JSON.stringify(encryptedHtml) : null,
    };
  } catch (error) {
    logger.error('[EMAIL_ENCRYPTION] Encryption failed', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email encryption failed; refusing cleartext storage in production');
    }

    // Le mode dégradé n'est accepté qu'en dehors de la production.
    return { body, bodyEncrypted: null, htmlBody: htmlBody || null, htmlBodyEncrypted: null };
  }
}

/**
 * Déchiffre le contenu d'un email lors de la lecture.
 * Gère les emails anciens (non chiffrés) et les emails chiffrés.
 */
export function decryptEmailBody(email: {
  body: string;
  bodyEncrypted?: string | null;
  htmlBody?: string | null;
  htmlBodyEncrypted?: string | null;
}): { body: string; htmlBody: string | null } {
  // Cas 1: Email non chiffré (ancien ou mode dev)
  if (!email.bodyEncrypted || email.body !== ENCRYPTED_PLACEHOLDER) {
    return { body: email.body, htmlBody: email.htmlBody || null };
  }

  // Cas 2: Email chiffré — déchiffrer
  if (!isEncryptionEnabled()) {
    logger.warn('[EMAIL_ENCRYPTION] Cannot decrypt: ENCRYPTION_MASTER_KEY not set');
    return { body: '[Contenu chiffré — clé non disponible]', htmlBody: null };
  }

  try {
    const bodyPayload: EncryptedDataPayload = JSON.parse(email.bodyEncrypted);
    const decryptedBody = decryptData(bodyPayload);

    let decryptedHtml: string | null = null;
    if (email.htmlBodyEncrypted) {
      const htmlPayload: EncryptedDataPayload = JSON.parse(email.htmlBodyEncrypted);
      decryptedHtml = decryptData(htmlPayload);
    }

    return { body: decryptedBody, htmlBody: decryptedHtml };
  } catch (error) {
    logger.error('[EMAIL_ENCRYPTION] Decryption failed', error);
    return { body: '[Erreur de déchiffrement]', htmlBody: null };
  }
}

/**
 * Vérifie si un email est chiffré.
 */
export function isEmailEncrypted(email: { body: string; bodyEncrypted?: string | null }): boolean {
  return email.body === ENCRYPTED_PLACEHOLDER && !!email.bodyEncrypted;
}
