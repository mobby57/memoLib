/**
 * Chiffrement des corps d'emails — Phase 1 du lot "chiffrement RGPD".
 *
 * Wrappe encryptToken/decryptToken (même clé ENCRYPTION_MASTER_KEY que les
 * tokens OAuth) avec une gestion fail-safe :
 *
 * - encryptEmailBody : si la clé est absente ou l'encryption échoue, on retourne
 *   null. Le caller garde `body` en clair (backup). On ne crashe jamais.
 * - decryptEmailBody : si le déchiffrement échoue, on retourne null. Le caller
 *   utilise `bodyText` / `body` en fallback.
 *
 * Format produit : iv:authTag:cipher (hex) — compatible oauth-tokens.ts.
 */
import { logger } from '@/lib/logger';
import { encryptToken, decryptToken } from '@/lib/security/oauth-tokens';

export function encryptEmailBody(body: string | null | undefined): string | null {
  if (!body || body.length === 0) return null;
  try {
    return encryptToken(body);
  } catch (err) {
    logger.error('[email-encryption] encrypt failed — body gardé en clair', {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function decryptEmailBody(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null;
  try {
    return decryptToken(encrypted);
  } catch (err) {
    logger.error('[email-encryption] decrypt failed — fallback sur clair', {
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
