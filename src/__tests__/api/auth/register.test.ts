/**
 * Tests API — POST /api/auth/register
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';

const mockRegisterUser = jest.fn();

jest.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: unknown) => handler,
  withLoginRateLimit: (handler: unknown) => handler,
}));

jest.mock('@/lib/middleware/parse-json', () => ({
  parseJsonBody: jest.fn(async (req: NextRequest) => {
    const { NextResponse: ActualNextResponse } = jest.requireActual('next/server') as typeof import('next/server');
    try {
      const data = await req.json();
      return { success: true, data };
    } catch {
      return {
        success: false,
        response: ActualNextResponse.json({ error: 'JSON invalide' }, { status: 400 }),
      };
    }
  }),
}));

jest.mock('@/lib/services/registration-service', () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { POST } from '@/app/api/auth/register/route';

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

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisterUser.mockResolvedValue({
      success: true,
      user: { id: 'user-1', email: 'jean@avocat.fr', name: 'Jean Dupont' },
      tenant: { id: 'tenant-1', name: 'Cabinet Dupont' },
    });
  });

  it('retourne 400 si champs obligatoires manquants', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: 'Champs obligatoires manquants',
      status: 400,
    });

    const res = await POST(makeRequest({ prenom: '', nom: '', email: '', password: '' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('obligatoires');
  });

  it('retourne 400 si mot de passe trop faible', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: 'Le mot de passe doit contenir au moins 12 caractères',
      status: 400,
    });

    const res = await POST(makeRequest({ ...VALID_BODY, password: '1234567' }));
    expect(res.status).toBe(400);
  });

  it('retourne 409 si email déjà utilisé', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: 'Impossible de créer le compte. Vérifiez vos informations ou essayez de vous connecter.',
      status: 409,
    });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
  });

  it('retourne 400 si plan invalide', async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: 'Plan tarifaire invalide',
      status: 400,
    });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Plan tarifaire');
  });

  it('retourne 200 avec user et tenant en cas de succès', async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('jean@avocat.fr');
    expect(data.tenant.name).toBe('Cabinet Dupont');
    expect(mockRegisterUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jean@avocat.fr', plan: 'SOLO' }),
      expect.objectContaining({ createSubscription: true, requireEmailVerification: false })
    );
  });

  it('retourne 503 si base de données indisponible', async () => {
    mockRegisterUser.mockRejectedValue(new Error("Can't reach database server"));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });
});
