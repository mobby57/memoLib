import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/security/audit-trail';
import type { TenantSettingsPublic, TenantSettingsUpdate } from '@/lib/validation/settings.schema';

/**
 * Service de configuration cabinet (TenantSettings).
 *
 * Chaîne d'architecture : UI → Hook → Service (ici) → API → Authorization → Prisma → DB.
 *
 * Responsabilités :
 *  - Isolation tenant stricte (toute opération est scopée par tenantId).
 *  - Projection publique : ne renvoie jamais les secrets (smtpPass…) ni les
 *    limites de plan (maxUsers…), uniquement la config cabinet éditable.
 *  - Création paresseuse : si un tenant n'a pas encore de TenantSettings, on
 *    le crée avec les valeurs par défaut du schéma.
 *  - Audit : toute écriture est tracée dans l'audit trail chaîné.
 */

const CUID_FALLBACK_PREFIX = 'tset_';

function generateId(): string {
  // Identifiant simple et stable ; le schéma n'impose pas @default(cuid()).
  return `${CUID_FALLBACK_PREFIX}${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

/**
 * Projette une ligne TenantSettings vers sa forme publique (sans secrets).
 */
function toPublic(row: {
  tenantId: string;
  cabinetName: string | null;
  cabinetLogo: string | null;
  cabinetAddress: string | null;
  cabinetPhone: string | null;
  cabinetEmail: string | null;
  defaultLanguage: string;
  defaultTimezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  deadlineNotifications: boolean;
  ocrEnabled: boolean;
  aiEnabled: boolean;
  maxUploadSizeMb: number;
  maxFilesPerUpload: number;
  updatedAt: Date;
}): TenantSettingsPublic {
  return {
    tenantId: row.tenantId,
    cabinetName: row.cabinetName,
    cabinetLogo: row.cabinetLogo,
    cabinetAddress: row.cabinetAddress,
    cabinetPhone: row.cabinetPhone,
    cabinetEmail: row.cabinetEmail,
    defaultLanguage: row.defaultLanguage,
    defaultTimezone: row.defaultTimezone,
    dateFormat: row.dateFormat,
    emailNotifications: row.emailNotifications,
    deadlineNotifications: row.deadlineNotifications,
    ocrEnabled: row.ocrEnabled,
    aiEnabled: row.aiEnabled,
    maxUploadSizeMb: row.maxUploadSizeMb,
    maxFilesPerUpload: row.maxFilesPerUpload,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Sélection des colonnes publiques (jamais de secrets). */
const PUBLIC_SELECT = {
  tenantId: true,
  cabinetName: true,
  cabinetLogo: true,
  cabinetAddress: true,
  cabinetPhone: true,
  cabinetEmail: true,
  defaultLanguage: true,
  defaultTimezone: true,
  dateFormat: true,
  emailNotifications: true,
  deadlineNotifications: true,
  ocrEnabled: true,
  aiEnabled: true,
  maxUploadSizeMb: true,
  maxFilesPerUpload: true,
  updatedAt: true,
} as const;

/**
 * Récupère la config cabinet d'un tenant, en la créant avec les valeurs par
 * défaut si elle n'existe pas encore.
 */
export async function getTenantSettings(tenantId: string): Promise<TenantSettingsPublic> {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  const existing = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: PUBLIC_SELECT,
  });

  if (existing) {
    return toPublic(existing);
  }

  const created = await prisma.tenantSettings.create({
    data: {
      id: generateId(),
      tenantId,
      updatedAt: new Date(),
    },
    select: PUBLIC_SELECT,
  });

  return toPublic(created);
}

/**
 * Met à jour partiellement la config cabinet d'un tenant.
 *
 * @param tenantId  tenant cible (isolation)
 * @param userId    utilisateur à l'origine du changement (audit)
 * @param patch     champs validés (Zod) à mettre à jour
 */
export async function updateTenantSettings(
  tenantId: string,
  userId: string,
  patch: TenantSettingsUpdate
): Promise<TenantSettingsPublic> {
  if (!tenantId) {
    throw new Error('tenantId is required');
  }

  // S'assure que la ligne existe (création paresseuse) avant l'update.
  await getTenantSettings(tenantId);

  const updated = await prisma.tenantSettings.update({
    where: { tenantId },
    data: {
      ...patch,
      updatedAt: new Date(),
    },
    select: PUBLIC_SELECT,
  });

  // Audit — trace des champs modifiés (pas des valeurs sensibles).
  await createAuditLog({
    userId,
    tenantId,
    action: 'UPDATE',
    resource: 'TENANT',
    resourceId: tenantId,
    description: 'Mise à jour de la configuration cabinet (TenantSettings)',
    metadata: { changedKeys: Object.keys(patch) },
    success: true,
  });

  return toPublic(updated);
}
