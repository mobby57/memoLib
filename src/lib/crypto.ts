/**
 * Utilitaires cryptographiques pour l'integrite des donnees
 * Zero-Trust Architecture - IA Poste Manager
 */

import crypto from 'crypto';
import fs from 'fs/promises';

/**
 * Calcule le hash SHA-256 d'une donnee
 * @param data - Donnees a hasher (string ou Buffer)
 * @returns Hash hexadecimal
 */
export function calculateHash(data: string | Buffer): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Verifie qu'un hash correspond a des donnees
 * @param data - Donnees a verifier
 * @param hash - Hash attendu
 * @returns true si le hash correspond
 */
export function verifyHash(data: string | Buffer, hash: string): boolean {
  return calculateHash(data) === hash;
}

/**
 * Calcule le hash d'un fichier
 * @param filePath - Chemin absolu du fichier
 * @returns Promise du hash hexadecimal
 */
export async function hashFile(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  return calculateHash(buffer);
}

/**
 * Calcule le hash d'un evenement d'audit
 * Utilise pour garantir l'integrite du journal d'audit
 * @param event - evenement d'audit
 * @returns Hash de l'evenement
 */
export function hashAuditEvent(event: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  timestamp: Date | string;
  metadata?: any;
}): string {
  const eventString = JSON.stringify({
    tenantId: event.tenantId,
    userId: event.userId,
    action: event.action,
    objectType: event.objectType,
    objectId: event.objectId,
    timestamp: event.timestamp instanceof Date 
      ? event.timestamp.toISOString() 
      : event.timestamp,
    metadata: event.metadata
  });
  
  return calculateHash(eventString);
}

/**
 * Genere un hash pour un document avec ses metadonnees
 * @param file - Buffer du fichier
 * @param metadata - Metadonnees du document
 * @returns Hash combine
 */
export function hashDocument(
  file: Buffer,
  metadata: {
    filename: string;
    mimeType: string;
    uploadedBy: string;
    timestamp: Date | string;
  }
): string {
  const fileHash = calculateHash(file);
  const metadataString = JSON.stringify({
    filename: metadata.filename,
    mimeType: metadata.mimeType,
    uploadedBy: metadata.uploadedBy,
    timestamp: metadata.timestamp instanceof Date 
      ? metadata.timestamp.toISOString() 
      : metadata.timestamp,
    fileHash
  });
  
  return calculateHash(metadataString);
}

/**
 * Verifie l'integrite d'un document
 * @param file - Buffer du fichier actuel
 * @param expectedHash - Hash attendu
 * @param metadata - Metadonnees du document
 * @returns true si l'integrite est confirmee
 */
export function verifyDocumentIntegrity(
  file: Buffer,
  expectedHash: string,
  metadata?: {
    filename: string;
    mimeType: string;
    uploadedBy: string;
    timestamp: Date | string;
  }
): boolean {
  if (metadata) {
    const computedHash = hashDocument(file, metadata);
    return computedHash === expectedHash;
  }
  
  // Verification simple du fichier seul
  return verifyHash(file, expectedHash);
}
