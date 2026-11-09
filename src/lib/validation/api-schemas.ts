import { z } from 'zod';

// --- Client Schemas ---
export const createClientSchema = z.object({
  tenantId: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  codePostal: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  nationality: z.string().optional().nullable(),
  civilite: z.enum(['M', 'Mme', 'Mlle']).optional(),
});

export const updateClientSchema = createClientSchema.partial();

// --- Dossier Schemas ---
export const createDossierSchema = z.object({
  clientId: z.string().uuid('Client ID must be a valid UUID'),
  titre: z.string().min(1).max(500),
  type: z.enum(['civil', 'commercial', 'penal', 'immobilier', 'droit-social']).optional(),
  description: z.string().max(2000).optional(),
  dateDuLitige: z.string().datetime().optional(),
  montantDemande: z.number().positive().optional(),
});

export const updateDossierSchema = createDossierSchema.partial();

// --- Document/Upload Schemas ---
export const uploadDocumentSchema = z.object({
  dossierId: z.string().trim().min(1).max(100),
  type: z.string().trim().min(1).max(100).default('document'),
  name: z.string().optional(),
  originalName: z.string().optional(),
});

// --- Email Schemas ---
export const incomingEmailPayloadSchema = z.object({
  rawEmail: z.string().optional(),
  from: z.string().email(),
  to: z.string().email(),
  subject: z.string().max(500),
  body: z.string(),
  bodyHtml: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  messageId: z.string().optional(),
});

// --- Webhook Schemas ---
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({}).passthrough(),
});

// --- Pagination ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// --- Rate Limit Recovery ---
export const rateLimitRecoverySchema = z.object({
  retryAfter: z.number().int().positive(),
  remaining: z.number().int().min(0),
});

// Type exports for TypeScript
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateDossierInput = z.infer<typeof createDossierSchema>;
export type IncomingEmailPayload = z.infer<typeof incomingEmailPayloadSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
