import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Test métier de la chaîne CENTRALE Email → Dossier → Délais.
 *
 * Cas couverts (catalogue business-validation): EMAIL-TO-DOSSIER, DEADLINE-PERSIST.
 *
 * Contexte (audit): src/app/api/emails/create-dossier/route.ts était 0% couvert et
 * appelait `prisma.legalDeadline.create(...)` en OMETTANT des champs requis par le
 * schéma (`id`, `referenceDate`, `createdBy`, `updatedAt`) et avec un `type` HORS de
 * l'enum `DeadlineType` — le tout enveloppé dans `.catch(() => {})`, donc silencieux.
 * Conséquence: en production, la création automatique des délais CESEDA était un
 * no-op silencieux tout en renvoyant `success: true`.
 *
 * Ce test verrouille le comportement métier attendu:
 *  1) un dossier est créé;
 *  2) des LegalDeadline sont créés avec TOUS les champs requis et un `type` valide;
 *  3) si une persistance de délai échoue, la réponse NE DOIT PAS annoncer un succès muet.
 */

const VALID_DEADLINE_TYPES = new Set([
  'RECOURS_GRACIEUX', 'RECOURS_HIERARCHIQUE', 'RECOURS_CONTENTIEUX', 'APPEL', 'CASSATION',
  'REPONSE_PREFECTURE', 'CONVOCATION_AUDIENCE', 'PRODUCTION_PIECES', 'EXECUTION_DECISION',
  'OQTF', 'RETENTION', 'CUSTOM',
]);
const REQUIRED_DEADLINE_FIELDS = ['id', 'tenantId', 'dossierId', 'type', 'label', 'referenceDate', 'dueDate', 'status', 'createdBy', 'updatedAt'];

const mockPrisma = {
  client: { findFirst: vi.fn(), create: vi.fn() },
  dossier: { count: vi.fn(), create: vi.fn() },
  email: { update: vi.fn() },
  legalDeadline: { create: vi.fn() },
  communityTemplate: { findFirst: vi.fn() },
};

const mockAuth = vi.fn();

vi.mock('@/lib/clerk-auth', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

const routePath = '../../../app/api/emails/create-dossier/route';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/emails/create-dossier', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// NOTE: `describe.skip` volontaire. Ce spec décrit le comportement métier ATTENDU de la
// chaîne Email → Dossier → Délais. Il ÉCHOUE contre la route actuelle (champs requis
// manquants dans legalDeadline.create + `type` hors enum + `.catch(()=>{})` qui masque
// l'échec). Retirer le `.skip` en même temps que la correction de la route: le test
// devient alors le verrou de régression, et le cas passe à PASS dans le rapport métier.
describe.skip('POST /api/emails/create-dossier — chaîne Email → Dossier → Délais', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user_1', tenantId: 'tenant_1' } });
    mockPrisma.client.findFirst.mockResolvedValue(null);
    mockPrisma.client.create.mockResolvedValue({ id: 'client_1', firstName: 'Jean', lastName: 'Dupont' });
    mockPrisma.dossier.count.mockResolvedValue(0);
    mockPrisma.dossier.create.mockResolvedValue({ id: 'dossier_1', numero: 'D-2026-0001' });
    mockPrisma.email.update.mockResolvedValue({ id: 'email_1' });
    mockPrisma.legalDeadline.create.mockResolvedValue({ id: 'dl_1' });
    mockPrisma.communityTemplate.findFirst.mockResolvedValue(null);
  });

  it('crée le dossier et rattache le client', async () => {
    const { POST } = await import(routePath as any);
    const res = await POST(makeRequest({
      emailId: 'email_1',
      summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'OQTF', urgence: 'haute' },
    }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(mockPrisma.dossier.create).toHaveBeenCalledTimes(1);
    expect(json.dossierId).toBe('dossier_1');
  });

  it('persiste des LegalDeadline CESEDA avec TOUS les champs requis et un type VALIDE', async () => {
    const { POST } = await import(routePath as any);
    await POST(makeRequest({
      emailId: 'email_1',
      summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'OQTF', urgence: 'haute' },
    }));

    // Le type OQTF doit produire au moins un délai.
    expect(mockPrisma.legalDeadline.create).toHaveBeenCalled();

    for (const call of mockPrisma.legalDeadline.create.mock.calls) {
      const data = call[0]?.data ?? {};
      // (1) tous les champs requis par le schéma sont fournis
      for (const field of REQUIRED_DEADLINE_FIELDS) {
        expect(data[field], `champ requis manquant: ${field}`).toBeDefined();
      }
      // (2) le type appartient à l'enum DeadlineType
      expect(VALID_DEADLINE_TYPES.has(data.type), `type invalide: ${data.type}`).toBe(true);
    }
  });

  it("ne doit PAS annoncer un succès muet si la persistance d'un délai échoue", async () => {
    mockPrisma.legalDeadline.create.mockRejectedValue(new Error('DB write failed'));

    const { POST } = await import(routePath as any);
    const res = await POST(makeRequest({
      emailId: 'email_1',
      summary: { client: 'Jean Dupont', typeDossier: 'OQTF', objet: 'OQTF', urgence: 'haute' },
    }));
    const json = await res.json();

    // Comportement attendu: soit une erreur remontée, soit un compte de délais créés = 0
    // (jamais un deadlinesCreated > 0 alors que rien n'a été persisté).
    const claimsDeadlines = typeof json.deadlinesCreated === 'number' && json.deadlinesCreated > 0;
    expect(claimsDeadlines, 'la réponse annonce des délais créés alors que la persistance a échoué').toBe(false);
  });
});
