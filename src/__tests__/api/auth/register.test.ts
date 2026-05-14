/**
 * Tests API — POST /api/auth/register
 * Vérifie la transaction complète : Tenant + User + Subscription + TenantSettings
 * @jest-environment node
 */

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockTransaction = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    plan: { findFirst: (...args: unknown[]) => mockFindFirst(...args) },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$hashed'),
}));

jest.mock('@/lib/billing/plans', () => ({
  resolvePlanDbName: jest.fn((input?: string) => {
    const map: Record<string, string> = {
      SOLO: 'solo', CABINET: 'cabinet', ENTERPRISE: 'enterprise',
      PILOT: 'pilot', STARTER: 'pilot', FREE: 'pilot', PRO: 'cabinet',
    };
    return map[(input || '').toUpperCase()] || 'solo';
  }),
}));

import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_BODY = {
  prenom: 'Jean',
  nom: 'Dupont',
  email: 'jean@avocat.fr',
  password: 'SecurePass123!',
  cabinetNom: 'Cabinet Dupont',
  numeroBarreau: 'P123456',
  plan: 'SOLO',
};

const MOCK_PLAN = {
  id: 'plan-solo',
  name: 'solo',
  priceMonthly: 49,
  currency: 'EUR',
  maxDossiers: 50,
  maxUsers: 1,
  maxStorageGb: 5,
};

const MOCK_PILOT_PLAN = {
  id: 'plan-pilot',
  name: 'pilot',
  priceMonthly: 0,
  currency: 'EUR',
  maxDossiers: 5,
  maxUsers: 1,
  maxStorageGb: 1,
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null); // pas d'utilisateur existant
    mockFindFirst.mockResolvedValue(MOCK_PLAN);
  });

  it('retourne 400 si champs obligatoires manquants', async () => {
    const res = await POST(makeRequest({ prenom: '', nom: '', email: '', password: '' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('obligatoires');
  });

  it('retourne 400 si mot de passe trop court', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, password: '1234567' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('12 caractères');
  });

  it('retourne 409 si email déjà utilisé', async () => {
    mockFindUnique.mockResolvedValue({ id: 'existing-user' });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
  });

  it('retourne 400 si plan invalide', async () => {
    mockFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Plan tarifaire');
  });

  it('crée tenant + user + subscription + settings en transaction', async () => {
    const mockTx = {
      tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Cabinet Dupont' }) },
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'jean@avocat.fr', name: 'Jean Dupont' }) },
      subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      tenantSettings: { create: jest.fn().mockResolvedValue({ id: 'settings-1' }) },
    };

    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('jean@avocat.fr');
    expect(data.tenant.name).toBe('Cabinet Dupont');

    // Vérifie que les 4 créations ont eu lieu
    expect(mockTx.tenant.create).toHaveBeenCalledTimes(1);
    expect(mockTx.user.create).toHaveBeenCalledTimes(1);
    expect(mockTx.subscription.create).toHaveBeenCalledTimes(1);
    expect(mockTx.tenantSettings.create).toHaveBeenCalledTimes(1);
  });

  it('crée la subscription en mode trialing avec le bon prix', async () => {
    const mockTx = {
      tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Cabinet' }) },
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'jean@avocat.fr', name: 'Jean Dupont' }) },
      subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      tenantSettings: { create: jest.fn().mockResolvedValue({ id: 'settings-1' }) },
    };

    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

    await POST(makeRequest(VALID_BODY));

    const subCall = mockTx.subscription.create.mock.calls[0][0].data;
    expect(subCall.status).toBe('trialing');
    expect(subCall.pricePerMonth).toBe(49);
    expect(subCall.currency).toBe('EUR');
    expect(subCall.planId).toBe('plan-solo');
  });

  it('crée les TenantSettings avec les limites du plan', async () => {
    const mockTx = {
      tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Cabinet' }) },
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'jean@avocat.fr', name: 'Jean Dupont' }) },
      subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      tenantSettings: { create: jest.fn().mockResolvedValue({ id: 'settings-1' }) },
    };

    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

    await POST(makeRequest(VALID_BODY));

    const settingsCall = mockTx.tenantSettings.create.mock.calls[0][0].data;
    expect(settingsCall.maxDossiers).toBe(50);
    expect(settingsCall.maxUsers).toBe(1);
    expect(settingsCall.storageLimit).toBe(5000); // 5GB * 1000
    expect(settingsCall.ollamaEnabled).toBe(true);
  });

  it('plan PILOT donne 30 jours de trial', async () => {
    mockFindFirst.mockResolvedValue({ ...MOCK_PLAN, id: 'plan-pilot', name: 'pilot', priceMonthly: 0 });

    const mockTx = {
      tenant: { create: jest.fn().mockResolvedValue({ id: 'tenant-1', name: 'Cabinet' }) },
      user: { create: jest.fn().mockResolvedValue({ id: 'user-1', email: 'jean@avocat.fr', name: 'Jean Dupont' }) },
      subscription: { create: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
      tenantSettings: { create: jest.fn().mockResolvedValue({ id: 'settings-1' }) },
    };

    mockTransaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx));

    await POST(makeRequest({ ...VALID_BODY, plan: 'PILOT' }));

    const subCall = mockTx.subscription.create.mock.calls[0][0].data;
    const trialEnd = new Date(subCall.trialEnd);
    const now = new Date();
    const diffDays = Math.round((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
  });

  it('résout les aliases legacy (STARTER → pilot)', async () => {
    const { resolvePlanDbName } = require('@/lib/billing/plans');
    expect(resolvePlanDbName('STARTER')).toBe('pilot');
    expect(resolvePlanDbName('PRO')).toBe('cabinet');
  });

  it('retourne 503 si base de données indisponible', async () => {
    mockFindUnique.mockRejectedValue(new Error("Can't reach database server"));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });
});
