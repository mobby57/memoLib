/**
 * Spec de caractérisation — chaîne Email -> Dossier -> Délais (P0).
 *
 * ⚠️ describe.skip VOLONTAIRE.
 *
 * Ce test verrouille la chaîne métier la plus critique et documente un BUG CONFIRMÉ
 * (lecture du code de src/app/api/emails/create-dossier/route.ts) :
 *
 *   La route omet des champs REQUIS de LegalDeadline (id, referenceDate, createdBy,
 *   updatedAt — aucun @default dans le schéma) et émet des `type` hors de l'enum
 *   DeadlineType (OQTF_DEPART, OQTF_RECOURS_TA, ASILE_OFPRA, TS_RECOURS_GRACIEUX...).
 *   Chaque prisma.legalDeadline.create() jette donc une erreur de validation —
 *   mais `.catch(() => {})` l'avale, et la route renvoie { success: true,
 *   deadlinesCreated: N } alors que ZÉRO délai n'est persisté.
 *
 *   => Un cabinet perd un délai silencieusement. C'est exactement la thèse produit
 *      à empêcher.
 *
 * Tant que la route n'est pas corrigée, ce test échouerait ; il est donc `.skip`
 * pour ne pas casser la suite CI sur un travail hors périmètre de cette PR.
 *
 * POUR CORRIGER (puis dé-skip) :
 *   1. Dans create-dossier/route.ts, fournir pour chaque legalDeadline.create :
 *      id: crypto.randomUUID(), referenceDate: <date>, createdBy: user.id,
 *      updatedAt: new Date().
 *   2. Mapper les libellés CESEDA sur des valeurs valides de l'enum DeadlineType
 *      (RECOURS_CONTENTIEUX, OQTF, RETENTION, CUSTOM, ...).
 *   3. Retirer les `.catch(() => {})` sur les créations de délais : un échec de
 *      persistance d'un délai doit faire échouer la requête (ou au minimum ne pas
 *      renvoyer success:true avec un deadlinesCreated mensonger).
 *   4. Retirer le `.skip` ci-dessous.
 *   5. Passer EMAIL-TO-DOSSIER et DEADLINE-PERSIST à "PASS" (retirer awaitingFix)
 *      dans scripts/business-cases.json.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/lib/clerk-auth';
import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/emails/create-dossier/route';

vi.mock('@/lib/clerk-auth', () => ({ auth: vi.fn() }));

const mockPrisma = {
  client: { findFirst: vi.fn(), create: vi.fn() },
  dossier: { count: vi.fn(), create: vi.fn() },
  email: { update: vi.fn() },
  legalDeadline: { create: vi.fn() },
  communityTemplate: { findFirst: vi.fn() },
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

const mockedAuth = vi.mocked(auth);

// Valeurs valides de l'enum DeadlineType (prisma/schema.prisma)
const VALID_DEADLINE_TYPES = new Set([
  'RECOURS_GRACIEUX',
  'RECOURS_HIERARCHIQUE',
  'RECOURS_CONTENTIEUX',
  'APPEL',
  'CASSATION',
  'REPONSE_PREFECTURE',
  'CONVOCATION_AUDIENCE',
  'PRODUCTION_PIECES',
  'EXECUTION_DECISION',
  'OQTF',
  'RETENTION',
  'CUSTOM',
]);

// Champs requis de LegalDeadline sans @default (prisma/schema.prisma)
const REQUIRED_DEADLINE_FIELDS = ['id', 'referenceDate', 'createdBy', 'updatedAt'];

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/emails/create-dossier', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe.skip('[P0] Email -> Dossier -> Délais (caractérisation, awaiting route fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuth.mockResolvedValue({
      isAuthenticated: true,
      clerkUserId: 'clerk_1',
      orgId: 'org_1',
      user: { id: 'user_1', tenantId: 'tenant_1' },
    } as never);

    mockPrisma.client.findFirst.mockResolvedValue({
      id: 'client_1',
      firstName: 'Jean',
      lastName: 'Dupont',
    });
    mockPrisma.dossier.count.mockResolvedValue(0);
    mockPrisma.dossier.create.mockResolvedValue({
      id: 'dossier_1',
      numero: 'D-2026-0001',
    });
    mockPrisma.email.update.mockResolvedValue({});
    mockPrisma.legalDeadline.create.mockResolvedValue({ id: 'dl_1' });
    mockPrisma.communityTemplate.findFirst.mockResolvedValue(null);
  });

  it('crée le dossier et rattache l’email (EMAIL-TO-DOSSIER)', async () => {
    const res = await POST(
      makeRequest({
        emailId: 'email_1',
        summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'Recours' },
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockPrisma.dossier.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.email.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'email_1' },
        data: expect.objectContaining({ dossierId: 'dossier_1' }),
      })
    );
  });

  it('persiste chaque délai avec les champs requis et un type ENUM valide (DEADLINE-PERSIST)', async () => {
    await POST(
      makeRequest({
        summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'Recours OQTF' },
      })
    );

    // OQTF => 2 délais CESEDA attendus
    expect(mockPrisma.legalDeadline.create).toHaveBeenCalled();

    for (const call of mockPrisma.legalDeadline.create.mock.calls) {
      const data = call[0].data;
      // Champs requis présents (sinon Prisma jette — bug actuel avalé par .catch)
      for (const field of REQUIRED_DEADLINE_FIELDS) {
        expect(data, `champ requis manquant: ${field}`).toHaveProperty(field);
      }
      // type dans l'enum réel (sinon Prisma jette — bug actuel)
      expect(VALID_DEADLINE_TYPES.has(data.type)).toBe(true);
    }
  });

  it('ne renvoie PAS success:true si la persistance d’un délai échoue (pas de perte silencieuse)', async () => {
    mockPrisma.legalDeadline.create.mockRejectedValueOnce(
      new Error('P2002 / validation enum')
    );

    const res = await POST(
      makeRequest({
        summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'Recours OQTF' },
      })
    );
    const json = await res.json();

    // Le comportement attendu APRÈS correction : un échec de délai n'est pas masqué.
    expect(json.success).not.toBe(true);
  });
});
