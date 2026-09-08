#!/usr/bin/env node
/**
 * Déchiffre un fichier "coffre-fort" intake (.xlsx.enc) produit par
 * /api/intake/export (encryptFile de src/lib/security/encryption.ts).
 *
 * Format du fichier chiffré : [iv(16)][authTag(16)][ciphertext] — AES-256-GCM.
 * Clé dérivée de ENCRYPTION_MASTER_KEY via scrypt (sel déterministe HMAC).
 *
 * Usage :
 *   ENCRYPTION_MASTER_KEY=... node scripts/decrypt-intake-vault.mjs <input.xlsx.enc> [output.xlsx]
 *
 * ⚠️ Le fichier déchiffré contient des données personnelles sensibles.
 *    À manipuler dans un environnement sécurisé et à supprimer après usage.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY_MINIMUM_LENGTH = 32;

function deriveKey(masterKey) {
  if (!masterKey || masterKey.trim().length < MASTER_KEY_MINIMUM_LENGTH) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY manquant ou trop court (>= ${MASTER_KEY_MINIMUM_LENGTH} caractères).`
    );
  }
  // DOIT être identique à getMasterKeyOrThrow() (src/lib/security/encryption.ts).
  const salt = crypto
    .createHmac('sha256', 'memolib-key-derivation-v1')
    .update(masterKey)
    .digest()
    .subarray(0, 16);
  return crypto.scryptSync(masterKey, salt, 32, { N: 16384, r: 8, p: 1 });
}

function decryptBuffer(data, key) {
  if (data.length < 32) throw new Error('Fichier chiffré trop court / corrompu.');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

function main() {
  const [, , inputArg, outputArg] = process.argv;
  if (!inputArg) {
    console.error('Usage: ENCRYPTION_MASTER_KEY=... node scripts/decrypt-intake-vault.mjs <input.xlsx.enc> [output.xlsx]');
    process.exit(1);
  }

  const key = deriveKey(process.env.ENCRYPTION_MASTER_KEY);
  const encrypted = fs.readFileSync(inputArg);

  let plain;
  try {
    plain = decryptBuffer(encrypted, key);
  } catch (e) {
    console.error('Échec du déchiffrement :', e.message);
    console.error('Vérifiez que ENCRYPTION_MASTER_KEY correspond à celle du déploiement.');
    process.exit(2);
  }

  const output = outputArg || inputArg.replace(/\.enc$/i, '') || `${inputArg}.xlsx`;
  fs.writeFileSync(output, plain);
  console.log(`Déchiffré → ${path.resolve(output)} (${plain.length} octets)`);
}

main();
