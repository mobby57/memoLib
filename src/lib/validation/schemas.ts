/**
 * Schémas de validation Zod centralisés
 * Validation robuste pour toutes les entrées API
 */

import { z } from 'zod';

// ==================== VALIDATION UTILITAIRES ====================

/**
 * Validation email stricte
 */
export const emailSchema = z
  .string()
  .email('Email invalide')
  .min(5, 'Email trop court')
  .max(254, 'Email trop long')
  .transform(val => val.toLowerCase().trim());

/**
 * Validation mot de passe fort
 */
export const passwordSchema = z
  .string()
  .min(8, 'Mot de passe trop court (min 8 caractères)')
  .max(100, 'Mot de passe trop long')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Doit contenir au moins un caractère spécial');

/**
 * Validation téléphone français
 */
export const phoneSchema = z
  .string()
  .regex(/^(?:\+33|0)[1-9](?:[0-9]{8})$/, 'Numéro de téléphone français invalide')
  .optional();

/**
 * Validation UUID
 */
export const uuidSchema = z.string().uuid('ID invalide');

/**
 * Validation CUID (utilisé par Prisma)
 */
export const cuidSchema = z.string().cuid('ID invalide');

/**
 * Validation slug URL-safe
 */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format slug invalide')
  .min(3, 'Slug trop court')
  .max(100, 'Slug trop long');

/**
 * Validation montant en centimes
 */
export const amountCentsSchema = z
  .number()
  .int('Montant doit être un entier')
  .nonnegative('Montant ne peut pas être négatif')
  .max(9999999999, 'Montant trop élevé');

/**
 * Validation montant en euros
 */
export const amountEurosSchema = z
  .number()
  .nonnegative('Montant ne peut pas être négatif')
  .max(99999999.99, 'Montant trop élevé')
  .transform(val => Math.round(val * 100) / 100); // Arrondir à 2 décimales

// ==================== SCHÉMAS DOSSIERS ====================

export const dossierStatusSchema = z.enum(['NOUVEAU', 'EN_COURS', 'EN_ATTENTE', 'CLOS', 'ARCHIVE']);

export const dossierPrioritySchema = z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']);

export const createDossierSchema = z.object({
  reference: z.string().min(3, 'Référence trop courte').max(50, 'Référence trop longue').optional(),
  titre: z.string().min(3, 'Titre trop court').max(200, 'Titre trop long'),
  description: z.string().max(5000, 'Description trop longue').optional(),
  type: z.string().max(50).optional(),
  priority: dossierPrioritySchema.default('NORMALE'),
  clientId: cuidSchema.optional(),
  assignedToId: cuidSchema.optional(),
  deadline: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateDossierSchema = createDossierSchema.partial().extend({
  id: cuidSchema,
  status: dossierStatusSchema.optional(),
});

// ==================== SCHÉMAS CLIENTS ====================

export const createClientSchema = z.object({
  type: z.enum(['PARTICULIER', 'ENTREPRISE']),
  nom: z.string().min(2, 'Nom trop court').max(100),
  prenom: z.string().min(2).max(100).optional(),
  email: emailSchema,
  telephone: phoneSchema,
  adresse: z.string().max(500).optional(),
  codePostal: z
    .string()
    .regex(/^\d{5}$/, 'Code postal invalide')
    .optional(),
  ville: z.string().max(100).optional(),
  pays: z.string().max(50).default('France'),
  siret: z
    .string()
    .regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)')
    .optional(),
  raisonSociale: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  id: cuidSchema,
});

// ==================== SCHÉMAS DOCUMENTS ====================

export const documentTypeSchema = z.enum([
  'CONTRAT',
  'FACTURE',
  'COURRIER',
  'PIECE_JOINTE',
  'AUTRE',
]);

export const uploadDocumentSchema = z.object({
  dossierId: cuidSchema,
  type: documentTypeSchema.default('AUTRE'),
  titre: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// ==================== SCHÉMAS UTILISATEURS ====================

export const userRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'AVOCAT',
  'COLLABORATEUR',
  'SECRETAIRE',
  'CLIENT',
  'INVITE',
]);

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2).max(100),
  role: userRoleSchema.default('INVITE'),
  tenantId: cuidSchema.optional(),
});

export const updateUserSchema = z.object({
  id: cuidSchema,
  name: z.string().min(2).max(100).optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().length(6).optional(),
});

// ==================== SCHÉMAS FACTURES ====================

export const createFactureSchema = z.object({
  clientId: cuidSchema,
  dossierId: cuidSchema.optional(),
  numero: z.string().max(50).optional(), // Auto-généré si non fourni
  dateEmission: z.coerce.date().default(() => new Date()),
  dateEcheance: z.coerce.date(),
  lignes: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        quantite: z.number().positive().max(9999),
        prixUnitaireHT: amountEurosSchema,
        tva: z.number().min(0).max(100).default(20),
      })
    )
    .min(1, 'Au moins une ligne requise'),
  notes: z.string().max(2000).optional(),
  conditions: z.string().max(2000).optional(),
});

export const updateFactureSchema = createFactureSchema.partial().extend({
  id: cuidSchema,
  statut: z.enum(['BROUILLON', 'ENVOYEE', 'PAYEE', 'ANNULEE']).optional(),
});

// ==================== SCHÉMAS RECHERCHE/PAGINATION ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().max(200).optional(),
  filters: z.record(z.unknown()).optional(),
});

// ==================== SCHÉMAS WEBHOOKS ====================

export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
  livemode: z.boolean(),
});

// ==================== SCHÉMAS CONTACT ====================

export const contactFormSchema = z.object({
  nom: z.string().min(2).max(100),
  email: emailSchema,
  sujet: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
  captcha: z.string().optional(),
});

// ==================== HELPERS ====================

/**
 * Valider et parser une requête avec un schéma Zod
 * Retourne les données validées ou lance une erreur formatée
 */
export function validateRequest<T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    throw new ValidationError('Données invalides', errors);
  }

  return result.data;
}

/**
 * Erreur de validation personnalisée
 */
export class ValidationError extends Error {
  public readonly errors: Array<{ field: string; message: string }>;
  public readonly statusCode = 400;

  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  toJSON() {
    return {
      success: false,
      error: this.message,
      errors: this.errors,
    };
  }
}

/**
 * Middleware de validation pour API routes
 */
export function withValidation<T extends z.ZodSchema>(
  schema: T,
  handler: (data: z.infer<T>, req: Request) => Promise<Response>
) {
  return async (req: Request) => {
    try {
      let body: unknown;

      if (req.method !== 'GET') {
        body = await req.json();
      } else {
        const url = new URL(req.url);
        body = Object.fromEntries(url.searchParams);
      }

      const validatedData = validateRequest(schema, body);
      return handler(validatedData, req);
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json(error.toJSON(), { status: 400 });
      }

      if (error instanceof SyntaxError) {
        return Response.json(
          {
            success: false,
            error: 'JSON invalide',
          },
          { status: 400 }
        );
      }

      throw error;
    }
  };
}

export type CreateDossierInput = z.infer<typeof createDossierSchema>;
export type UpdateDossierInput = z.infer<typeof updateDossierSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateFactureInput = z.infer<typeof createFactureSchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
