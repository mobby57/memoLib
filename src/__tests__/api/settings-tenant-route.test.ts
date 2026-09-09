import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de la chaîne complète pour la configuration cabinet :
 *   API → Authorization (RBAC) → Service → Persistence → projection publique.
 *
 * On mocke Prisma et l'auth pour tester le comportement HTTP + autorisation
 * sans base réelle (incrément 1). Un test d'intégration DB pourra suivre.
 */

const mocks = vi.hoisted(() => {
  const tenantSettings = {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };
  const auditLog = {
    findFirst: vi.fn(),
    create: vi.fn(),
  };
  const prisma = { tenantSettings, auditLog };
  return { tenantSettings, auditLog, prisma, authMock: vi.fn() };
});

const mockTenantSettings = mocks.tenantSettings;
const mockAuditLog = mocks.auditLog;
const authMock = mocks.authMock;

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mocks.prisma,
  prisma: mocks.prisma,
}));

vi.mock('@/lib/clerk-auth', () => ({
  auth: () => mocks.authMock(),
}));

import { GET, PATCH } from '@/app/api/settings/tenant/route';

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: 'tenant-123',
    cabinetName: null,
    cabinetLogo: null,
    cabinetAddress: null,
    cabinetPhone: null,
    cabinetEmail: null,
    defaultLanguage: 'fr',
    defaultTimezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    emailNotifications: true,
    deadlineNotifications: true,
    ocrEnabled: false,
    aiEnabled: true,
    maxUploadSizeMb: 10,
    maxFilesPerUpload: 5,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/settings/tenant', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

const adminUser = { id: 'user-1', role: 'ADMIN', tenantId: 'tenant-123', email: 'a@b.fr' };
const internUser = { id: 'user-2', role: 'STAGIAIRE', tenantId: 'tenant-123', email: 'i@b.fr' };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuditLog.findFirst.mockResolvedValue(null);
  mockAuditLog.create.mockResolvedValue({});
});

describe('GET /api/settings/tenant', () => {
  it('renvoie 401 si non authentifié', async () => {
    authMock.mockResolvedValue({ user: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('renvoie la config (settings:read) et la crée si absente', async () => {
    authMock.mockResolvedValue({ user: adminUser });
    mockTenantSettings.findUnique.mockResolvedValue(null);
    mockTenantSettings.create.mockResolvedValue(makeRow());

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(mockTenantSettings.create).toHaveBeenCalled();
    expect(data.tenantId).toBe('tenant-123');
    expect(data.defaultLanguage).toBe('fr');
  });

  it("n'expose jamais les secrets (smtpPass, maxUsers)", async () => {
    authMock.mockResolvedValue({ user: adminUser });
    mockTenantSettings.findUnique.mockResolvedValue(makeRow());

    const res = await GET();
    const data = await res.json();

    expect(data).not.toHaveProperty('smtpPass');
    expect(data).not.toHaveProperty('maxUsers');
    expect(data).not.toHaveProperty('storageLimit');
  });

  it('un stagiaire peut lire (settings:read)', async () => {
    authMock.mockResolvedValue({ user: internUser });
    mockTenantSettings.findUnique.mockResolvedValue(makeRow());

    const res = await GET();
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/settings/tenant', () => {
  it('renvoie 403 pour un rôle sans settings:write (stagiaire)', async () => {
    authMock.mockResolvedValue({ user: internUser });

    const res = await PATCH(patchRequest({ cabinetName: 'Cabinet X' }));
    expect(res.status).toBe(403);
    expect(mockTenantSettings.update).not.toHaveBeenCalled();
  });

  it('met à jour la config pour un admin (settings:write)', async () => {
    authMock.mockResolvedValue({ user: adminUser });
    mockTenantSettings.findUnique.mockResolvedValue(makeRow());
    mockTenantSettings.update.mockResolvedValue(makeRow({ cabinetName: 'Cabinet X' }));

    const res = await PATCH(patchRequest({ cabinetName: 'Cabinet X' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cabinetName).toBe('Cabinet X');
    // Isolation tenant : le where utilise le tenant de la session.
    expect(mockTenantSettings.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-123' } })
    );
    // Audit tracé.
    expect(mockAuditLog.create).toHaveBeenCalled();
  });

  it('rejette un champ hors périmètre (maxUsers) via Zod strict', async () => {
    authMock.mockResolvedValue({ user: adminUser });

    const res = await PATCH(patchRequest({ maxUsers: 999 }));
    expect(res.status).toBe(400);
    expect(mockTenantSettings.update).not.toHaveBeenCalled();
  });

  it('rejette une valeur invalide (timezone inconnue)', async () => {
    authMock.mockResolvedValue({ user: adminUser });

    const res = await PATCH(patchRequest({ defaultTimezone: 'Mars/Olympus' }));
    expect(res.status).toBe(400);
  });

  it('rejette un body vide (aucun champ à mettre à jour)', async () => {
    authMock.mockResolvedValue({ user: adminUser });

    const res = await PATCH(patchRequest({}));
    expect(res.status).toBe(400);
  });
});
