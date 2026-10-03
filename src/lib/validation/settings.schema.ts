import { z } from 'zod';

/**
 * Configuration cabinet administrable via /settings (incrément 1).
 *
 * IMPORTANT — Périmètre de sécurité :
 *  - Ce schéma ne couvre QUE la configuration cabinet éditable par un
 *    administrateur de cabinet (RBAC settings:write).
 *  - Il n'expose JAMAIS les secrets d'infrastructure (smtpPass, clés API…)
 *    ni les limites de plan (maxDossiers, maxUsers, storageLimit) qui
 *    relèvent du billing / super-admin.
 */

export const TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Brussels',
  'Europe/Luxembourg',
  'America/New_York',
  'America/Martinique',
  'Indian/Reunion',
] as const;

export const LANGUAGES = ['fr', 'en', 'es'] as const;

export const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] as const;

/**
 * Champs modifiables via PATCH. Tous optionnels : la mise à jour est partielle
 * (on ne met à jour que ce qui est envoyé). `.strict()` rejette tout champ
 * inconnu — protection contre l'écriture de champs hors périmètre (ex: maxUsers).
 */
export const tenantSettingsUpdateSchema = z
  .object({
    // Identité du cabinet
    cabinetName: z.string().trim().min(1).max(200).nullable().optional(),
    cabinetLogo: z.string().trim().url().max(2000).nullable().optional(),
    cabinetAddress: z.string().trim().max(500).nullable().optional(),
    cabinetPhone: z.string().trim().max(40).nullable().optional(),
    cabinetEmail: z.string().trim().email().max(200).nullable().optional(),

    // Préférences régionales par défaut
    defaultLanguage: z.enum(LANGUAGES).optional(),
    defaultTimezone: z.enum(TIMEZONES).optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),

    // Politique de notifications
    emailNotifications: z.boolean().optional(),
    deadlineNotifications: z.boolean().optional(),

    // Fonctionnalités toggables par le cabinet
    ocrEnabled: z.boolean().optional(),
    aiEnabled: z.boolean().optional(),

    // Configuration documents / uploads
    maxUploadSizeMb: z.number().int().min(1).max(100).optional(),
    maxFilesPerUpload: z.number().int().min(1).max(50).optional(),
  })
  .strict();

export type TenantSettingsUpdate = z.infer<typeof tenantSettingsUpdateSchema>;

/**
 * Forme publique renvoyée par l'API (jamais de secrets).
 */
export type TenantSettingsPublic = {
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
  updatedAt: string;
};
