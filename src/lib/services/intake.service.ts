import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { encryptData, decryptData, encryptFile, decryptFile, type EncryptedDataPayload } from '@/lib/security/encryption';
import { getStorageService } from '@/lib/storage';
import { createAuditLog } from '@/lib/security/audit-trail';

/**
 * Service d'intake client — collecte de données/documents via formulaire.
 *
 * Chaîne : Webhook Sheet / UI → ce service → chiffrement → Prisma → DB.
 *
 * SÉCURITÉ RGPD :
 *  - Les réponses de formulaire et l'email client sont chiffrés (AES-256-GCM)
 *    AVANT insertion (src/lib/security/encryption.ts). La base ne contient
 *    jamais ces données en clair.
 *  - `clientEmailHash` (SHA-256) permet la déduplication/recherche sans exposer
 *    l'email.
 *  - Isolation tenant systématique (toute lecture/écriture scopée par tenantId).
 */

export type IntakeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETE' | 'NEEDS_HELP';
export type IntakeOrigin = 'googlesheet' | 'email' | 'manual';

export interface IntakeFieldDef {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export interface CreateIntakeInput {
  tenantId: string;
  type: string;
  origin: IntakeOrigin;
  sourceRef?: string | null;
  clientEmail?: string | null;
  clientId?: string | null;
  /** Réponses initiales éventuelles (clé → valeur). */
  data?: Record<string, unknown>;
  requiredFields?: IntakeFieldDef[];
  requiredDocuments?: string[];
  actorUserId?: string;
}

export interface IntakeRequestPublic {
  id: string;
  tenantId: string;
  clientId: string | null;
  type: string;
  status: IntakeStatus;
  origin: string;
  sourceRef: string | null;
  clientEmail: string | null; // déchiffré à la lecture
  data: Record<string, unknown>; // déchiffré à la lecture
  requiredFields: IntakeFieldDef[];
  requiredDocuments: string[];
  providedDocuments: string[];
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

/** Vue "à aider" : métadonnées non sensibles uniquement (pas de déchiffrement). */
export interface IntakeSummary {
  id: string;
  tenantId: string;
  type: string;
  status: IntakeStatus;
  origin: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function serialize(payload: EncryptedDataPayload): string {
  return JSON.stringify(payload);
}

function deserialize(value: string | null): EncryptedDataPayload | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as EncryptedDataPayload;
  } catch {
    return null;
  }
}

/**
 * Calcule la complétude (0..100) à partir des champs requis + réponses fournies.
 */
export function computeCompleteness(
  requiredFields: IntakeFieldDef[],
  data: Record<string, unknown>,
  requiredDocuments: string[],
  providedDocuments: string[]
): number {
  const requiredKeys = requiredFields.filter((f) => f.required).map((f) => f.id);
  const totalRequired = requiredKeys.length + requiredDocuments.length;
  if (totalRequired === 0) return 100;

  const fieldsOk = requiredKeys.filter((k) => {
    const v = data[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;

  const docsOk = requiredDocuments.filter((d) => providedDocuments.includes(d)).length;

  return Math.round(((fieldsOk + docsOk) / totalRequired) * 100);
}

function statusFromCompleteness(completeness: number, current?: IntakeStatus): IntakeStatus {
  if (completeness >= 100) return 'COMPLETE';
  if (completeness > 0) return 'IN_PROGRESS';
  // 0% : nouvelle demande non commencée → PENDING (sauf si déjà marquée NEEDS_HELP)
  return current === 'NEEDS_HELP' ? 'NEEDS_HELP' : 'PENDING';
}

function toPublic(row: any): IntakeRequestPublic {
  const emailPayload = deserialize(row.clientEmailEnc);
  const dataPayload = deserialize(row.encryptedData);
  return {
    id: row.id,
    tenantId: row.tenantId,
    clientId: row.clientId,
    type: row.type,
    status: row.status,
    origin: row.origin,
    sourceRef: row.sourceRef,
    clientEmail: emailPayload ? decryptData(emailPayload) : null,
    data: dataPayload ? (JSON.parse(decryptData(dataPayload)) as Record<string, unknown>) : {},
    requiredFields: (row.requiredFields as IntakeFieldDef[]) ?? [],
    requiredDocuments: (row.requiredDocuments as string[]) ?? [],
    providedDocuments: (row.providedDocuments as string[]) ?? [],
    completeness: row.completeness,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Crée une demande d'intake (chiffre les données sensibles).
 * Idempotent sur (tenantId, origin, sourceRef) : si la ligne Sheet a déjà été
 * ingérée, on renvoie l'existante plutôt que de dupliquer.
 */
export async function createIntakeRequest(input: CreateIntakeInput): Promise<IntakeRequestPublic> {
  if (!input.tenantId) throw new Error('tenantId is required');

  // Déduplication sur la source (webhook Sheet rejoué).
  if (input.sourceRef) {
    const existing = await prisma.intakeRequest.findUnique({
      where: {
        tenantId_origin_sourceRef: {
          tenantId: input.tenantId,
          origin: input.origin,
          sourceRef: input.sourceRef,
        },
      },
    });
    if (existing) return toPublic(existing);
  }

  const data = input.data ?? {};
  const requiredFields = input.requiredFields ?? [];
  const requiredDocuments = input.requiredDocuments ?? [];
  const completeness = computeCompleteness(requiredFields, data, requiredDocuments, []);

  const created = await prisma.intakeRequest.create({
    data: {
      tenantId: input.tenantId,
      clientId: input.clientId ?? null,
      type: input.type,
      origin: input.origin,
      sourceRef: input.sourceRef ?? null,
      status: statusFromCompleteness(completeness),
      clientEmailEnc: input.clientEmail ? serialize(encryptData(input.clientEmail)) : null,
      clientEmailHash: input.clientEmail ? hashEmail(input.clientEmail) : null,
      encryptedData: serialize(encryptData(JSON.stringify(data))),
      requiredFields: requiredFields as any,
      requiredDocuments: requiredDocuments as any,
      providedDocuments: [] as any,
      completeness,
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: input.actorUserId ?? 'system',
    tenantId: input.tenantId,
    action: 'CREATE',
    resource: 'CLIENT',
    resourceId: created.id,
    description: `Demande d'intake créée (type=${input.type}, origine=${input.origin})`,
    metadata: { origin: input.origin, type: input.type },
    success: true,
    sensitiveData: true,
  });

  return toPublic(created);
}

/**
 * Met à jour les réponses d'une demande (re-chiffre) et recalcule la complétude.
 */
export async function updateIntakeResponses(
  tenantId: string,
  id: string,
  data: Record<string, unknown>,
  providedDocuments: string[],
  actorUserId?: string
): Promise<IntakeRequestPublic> {
  const existing = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Intake request not found');

  const requiredFields = (existing.requiredFields as unknown as IntakeFieldDef[]) ?? [];
  const requiredDocuments = (existing.requiredDocuments as unknown as string[]) ?? [];
  const completeness = computeCompleteness(requiredFields, data, requiredDocuments, providedDocuments);

  const updated = await prisma.intakeRequest.update({
    where: { id },
    data: {
      encryptedData: serialize(encryptData(JSON.stringify(data))),
      providedDocuments: providedDocuments as any,
      completeness,
      status: statusFromCompleteness(completeness, existing.status as IntakeStatus),
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'UPDATE',
    resource: 'CLIENT',
    resourceId: id,
    description: `Réponses d'intake mises à jour (complétude=${completeness}%)`,
    success: true,
    sensitiveData: true,
  });

  return toPublic(updated);
}

/** Marque explicitement une demande comme nécessitant de l'aide. */
export async function markNeedsHelp(
  tenantId: string,
  id: string,
  actorUserId?: string
): Promise<IntakeSummary> {
  const existing = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Intake request not found');

  const updated = await prisma.intakeRequest.update({
    where: { id },
    data: { status: 'NEEDS_HELP', updatedAt: new Date() },
  });

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'UPDATE',
    resource: 'CLIENT',
    resourceId: id,
    description: "Demande d'intake marquée 'a besoin d'aide'",
    success: true,
  });

  return toSummary(updated);
}

function toSummary(row: any): IntakeSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type,
    status: row.status,
    origin: row.origin,
    completeness: row.completeness,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Liste les demandes "qui ont besoin d'aide" pour un tenant : celles en
 * PENDING (pas encore traitées) ou NEEDS_HELP (bloquées), ou incomplètes.
 * Ne déchiffre RIEN (métadonnées only) → sûr pour un widget dashboard.
 */
export async function listIntakeNeedingHelp(tenantId: string): Promise<IntakeSummary[]> {
  const rows = await prisma.intakeRequest.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'NEEDS_HELP', 'IN_PROGRESS'] },
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    take: 100,
  });
  return rows.map(toSummary);
}

/** Récupère une demande complète (déchiffrée) — usage restreint (lecture avocat). */
export async function getIntakeRequest(
  tenantId: string,
  id: string
): Promise<IntakeRequestPublic | null> {
  const row = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  return row ? toPublic(row) : null;
}

/** Métadonnées d'un fichier déposé (le contenu est chiffré dans le stockage). */
export interface IntakeUploadedFile {
  id: string;
  documentLabel: string; // à quel document requis il correspond
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string; // clé de l'objet chiffré dans le storage
  sha256: string;
  uploadedAt: string;
}

/**
 * Ajoute un fichier à une demande d'intake : chiffre le contenu, le stocke via
 * le StorageService, enregistre les métadonnées, coche le document requis
 * correspondant et recalcule la complétude.
 */
export async function addIntakeUploadedFile(
  tenantId: string,
  id: string,
  file: { documentLabel: string; fileName: string; mimeType: string; buffer: Buffer },
  actorUserId?: string
): Promise<{ file: IntakeUploadedFile; completeness: number }> {
  const existing = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Intake request not found');

  const fileId = crypto.randomUUID();
  const sha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
  const storageKey = `intake/${tenantId}/${id}/${fileId}.enc`;

  // Chiffre le contenu AVANT stockage (RGPD — jamais en clair au repos).
  const encryptedBytes = await encryptFile(file.buffer);
  await getStorageService().upload(storageKey, encryptedBytes, {
    contentType: 'application/octet-stream',
    metadata: { tenantId, intakeId: id, sha256 },
  });

  const meta: IntakeUploadedFile = {
    id: fileId,
    documentLabel: file.documentLabel,
    fileName: file.fileName,
    mimeType: file.mimeType,
    size: file.buffer.length,
    storageKey,
    sha256,
    uploadedAt: new Date().toISOString(),
  };

  const uploaded = ((existing.uploadedFiles as unknown as IntakeUploadedFile[]) ?? []).concat(meta);

  // Le document requis correspondant est désormais "fourni".
  const provided = new Set((existing.providedDocuments as unknown as string[]) ?? []);
  provided.add(file.documentLabel);
  const providedDocuments = Array.from(provided);

  const requiredFields = (existing.requiredFields as unknown as IntakeFieldDef[]) ?? [];
  const requiredDocuments = (existing.requiredDocuments as unknown as string[]) ?? [];
  const data = existing.encryptedData
    ? (JSON.parse(decryptData(JSON.parse(existing.encryptedData) as EncryptedDataPayload)) as Record<string, unknown>)
    : {};
  const completeness = computeCompleteness(requiredFields, data, requiredDocuments, providedDocuments);

  await prisma.intakeRequest.update({
    where: { id },
    data: {
      uploadedFiles: uploaded as any,
      providedDocuments: providedDocuments as any,
      completeness,
      status: statusFromCompleteness(completeness, existing.status as IntakeStatus),
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'CREATE',
    resource: 'DOCUMENT',
    resourceId: fileId,
    description: `Pièce déposée sur demande d'intake (${file.documentLabel})`,
    metadata: { intakeId: id, sha256 },
    success: true,
    sensitiveData: true,
  });

  return { file: meta, completeness };
}

/** Liste les métadonnées des fichiers déposés (sans contenu). */
export async function listIntakeUploadedFiles(
  tenantId: string,
  id: string
): Promise<IntakeUploadedFile[]> {
  const row = await prisma.intakeRequest.findFirst({
    where: { id, tenantId },
    select: { uploadedFiles: true },
  });
  return ((row?.uploadedFiles as unknown as IntakeUploadedFile[]) ?? []);
}

/**
 * Récupère une pièce déposée et la DÉCHIFFRE (contenu en clair en mémoire).
 * Réservé à un profil autorisé (RBAC côté route). Scope tenant strict.
 */
export async function getIntakeUploadedFile(
  tenantId: string,
  id: string,
  fileId: string
): Promise<{ meta: IntakeUploadedFile; content: Buffer } | null> {
  const files = await listIntakeUploadedFiles(tenantId, id);
  const meta = files.find((f) => f.id === fileId);
  if (!meta) return null;

  const encrypted = await getStorageService().download(meta.storageKey);
  const content = await decryptFile(encrypted);

  // Intégrité : le hash doit correspondre à celui enregistré au dépôt.
  const actualHash = crypto.createHash('sha256').update(content).digest('hex');
  if (actualHash !== meta.sha256) {
    throw new Error('Integrity check failed for uploaded file');
  }

  return { meta, content };
}

/**
 * Supprime une pièce déposée : retire l'objet du storage, la métadonnée, et si
 * plus aucun fichier ne couvre le document requis, décoche celui-ci et
 * recalcule la complétude. Scope tenant strict, audité.
 */
export async function deleteIntakeUploadedFile(
  tenantId: string,
  id: string,
  fileId: string,
  actorUserId?: string
): Promise<{ deleted: boolean; completeness: number }> {
  const existing = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Intake request not found');

  const files = (existing.uploadedFiles as unknown as IntakeUploadedFile[]) ?? [];
  const target = files.find((f) => f.id === fileId);
  if (!target) {
    return { deleted: false, completeness: existing.completeness };
  }

  // Supprime l'objet chiffré du stockage (non bloquant si déjà absent).
  try {
    await getStorageService().delete(target.storageKey);
  } catch {
    /* le fichier storage peut déjà être absent — on continue le nettoyage DB */
  }

  const remaining = files.filter((f) => f.id !== fileId);

  // Le document requis reste "fourni" seulement s'il reste un fichier du même label.
  const stillCovered = remaining.some((f) => f.documentLabel === target.documentLabel);
  const provided = new Set((existing.providedDocuments as unknown as string[]) ?? []);
  if (!stillCovered) provided.delete(target.documentLabel);
  const providedDocuments = Array.from(provided);

  const requiredFields = (existing.requiredFields as unknown as IntakeFieldDef[]) ?? [];
  const requiredDocuments = (existing.requiredDocuments as unknown as string[]) ?? [];
  const data = existing.encryptedData
    ? (JSON.parse(decryptData(JSON.parse(existing.encryptedData) as EncryptedDataPayload)) as Record<string, unknown>)
    : {};
  const completeness = computeCompleteness(requiredFields, data, requiredDocuments, providedDocuments);

  await prisma.intakeRequest.update({
    where: { id },
    data: {
      uploadedFiles: remaining as any,
      providedDocuments: providedDocuments as any,
      completeness,
      status: statusFromCompleteness(completeness, existing.status as IntakeStatus),
      updatedAt: new Date(),
    },
  });

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'DELETE',
    resource: 'DOCUMENT',
    resourceId: fileId,
    description: `Suppression d'une pièce d'intake (${target.documentLabel})`,
    metadata: { intakeId: id },
    success: true,
    sensitiveData: true,
  });

  return { deleted: true, completeness };
}

/** Résultat d'une purge RGPD d'intake. */
export interface IntakePurgeResult {
  purgedRequests: number;
  purgedFiles: number;
}

/**
 * Supprime tous les objets chiffrés d'une demande dans le storage.
 * Best-effort : on continue même si un objet est déjà absent.
 */
async function deleteStoredFiles(files: IntakeUploadedFile[]): Promise<number> {
  let deleted = 0;
  const storage = getStorageService();
  for (const f of files) {
    try {
      await storage.delete(f.storageKey);
      deleted++;
    } catch {
      /* déjà absent — on ignore */
    }
  }
  return deleted;
}

/**
 * Purge RGPD (droit à l'oubli) d'UNE demande d'intake : supprime les fichiers
 * chiffrés du storage puis la ligne en base. Scope tenant strict, audité.
 */
export async function purgeIntakeRequest(
  tenantId: string,
  id: string,
  actorUserId?: string
): Promise<IntakePurgeResult> {
  const existing = await prisma.intakeRequest.findFirst({ where: { id, tenantId } });
  if (!existing) return { purgedRequests: 0, purgedFiles: 0 };

  const files = (existing.uploadedFiles as unknown as IntakeUploadedFile[]) ?? [];
  const purgedFiles = await deleteStoredFiles(files);

  await prisma.intakeRequest.delete({ where: { id } });

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'DELETE',
    resource: 'CLIENT',
    resourceId: id,
    description: `Purge RGPD d'une demande d'intake (${purgedFiles} pièce(s) supprimée(s))`,
    metadata: { purgedFiles },
    success: true,
    sensitiveData: true,
  });

  return { purgedRequests: 1, purgedFiles };
}

/**
 * Purge RGPD par email client (droit à l'oubli global) : supprime TOUTES les
 * demandes d'intake d'un email pour un tenant, avec leurs fichiers chiffrés.
 * L'email est retrouvé via son hash SHA-256 (jamais l'email en clair).
 */
export async function purgeIntakeByClientEmail(
  tenantId: string,
  clientEmail: string,
  actorUserId?: string
): Promise<IntakePurgeResult> {
  const emailHash = hashEmail(clientEmail);
  const rows = await prisma.intakeRequest.findMany({
    where: { tenantId, clientEmailHash: emailHash },
    select: { id: true, uploadedFiles: true },
  });

  let purgedFiles = 0;
  for (const row of rows) {
    const files = (row.uploadedFiles as unknown as IntakeUploadedFile[]) ?? [];
    purgedFiles += await deleteStoredFiles(files);
  }

  const ids = rows.map((r) => r.id);
  if (ids.length > 0) {
    await prisma.intakeRequest.deleteMany({ where: { tenantId, id: { in: ids } } });
  }

  await createAuditLog({
    userId: actorUserId ?? 'system',
    tenantId,
    action: 'DELETE',
    resource: 'CLIENT',
    resourceId: emailHash,
    description: `Purge RGPD par email client (${ids.length} demande(s), ${purgedFiles} pièce(s))`,
    metadata: { requests: ids.length, purgedFiles },
    success: true,
    sensitiveData: true,
  });

  return { purgedRequests: ids.length, purgedFiles };
}
