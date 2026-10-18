import { EncryptionService } from '@/lib/security/encryption';

// Format produit par EncryptionService.encrypt : iv:authTag:chiffre (hexadecimal).
const CHIFFRE = /^[a-f\d]{32}:[a-f\d]{32}:[a-f\d]*$/i;

export function isEncryptedToken(valeur: string): boolean {
  return CHIFFRE.test(valeur);
}

/** Chiffre un jeton OAuth avant stockage (idempotent). */
export function encryptToken(valeur: string): string {
  return isEncryptedToken(valeur) ? valeur : EncryptionService.encrypt(valeur);
}

/**
 * Dechiffre un jeton OAuth. Un ancien jeton en clair est renvoye tel quel.
 * Un jeton au format chiffre qui ne se dechiffre pas (mauvaise cle) leve une
 * erreur : EncryptionService.decrypt, lui, renverrait le texte chiffre sans
 * rien signaler, et il partirait alors chez le fournisseur comme un jeton.
 */
export function decryptToken(valeur: string): string {
  if (!isEncryptedToken(valeur)) return valeur;
  const clair = EncryptionService.decrypt(valeur);
  if (clair === valeur) {
    throw new Error('Dechiffrement du jeton OAuth impossible');
  }
  return clair;
}
