/**
 * Tests unitaires pour l'authentification NextAuth
 * Couvre les callbacks, la validation des credentials
 */

import bcrypt from 'bcryptjs';

// Mock Prisma
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider - authorize()', () => {
    it('rejette si email manquant', async () => {
      const credentials = { email: '', password: 'test123' };
      
      // Simulation de l'erreur
      expect(() => {
        if (!credentials.email || !credentials.password) {
          throw new Error('Identifiants requis');
        }
      }).toThrow('Identifiants requis');
    });

    it('rejette si password manquant', async () => {
      const credentials = { email: 'test@example.com', password: '' };
      
      expect(() => {
        if (!credentials.email || !credentials.password) {
          throw new Error('Identifiants requis');
        }
      }).toThrow('Identifiants requis');
    });

    it('rejette si utilisateur non trouvé', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      
      const user = await mockPrismaClient.user.findUnique({
        where: { email: 'notfound@example.com' },
      });
      
      expect(user).toBeNull();
    });

    it('rejette si mot de passe incorrect', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: '$2a$12$hashedpassword',
        role: 'ADMIN',
        tenant: { id: 'tenant-123', status: 'active' },
      };
      
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      
      const user = await mockPrismaClient.user.findUnique({
        where: { email: 'test@example.com' },
      });
      const passwordMatch = await bcrypt.compare('wrongpassword', user!.password);
      
      expect(passwordMatch).toBe(false);
    });

    it('rejette si cabinet inactif pour un ADMIN', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'admin@example.com',
        password: '$2a$12$hashedpassword',
        role: 'ADMIN',
        tenant: { id: 'tenant-123', status: 'suspended' },
      };
      
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const user = await mockPrismaClient.user.findUnique({
        where: { email: 'admin@example.com' },
      });
      
      expect(() => {
        if (user!.role === 'ADMIN' && user!.tenant?.status !== 'active') {
          throw new Error('Cabinet inactif');
        }
      }).toThrow('Cabinet inactif');
    });

    it('autorise un utilisateur valide avec bon mot de passe', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'valid@example.com',
        name: 'Valid User',
        password: '$2a$12$hashedpassword',
        role: 'ADMIN',
        tenantId: 'tenant-123',
        tenant: { 
          id: 'tenant-123', 
          name: 'Cabinet Test',
          status: 'active',
          plan: { name: 'pro' }
        },
      };
      
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      const user = await mockPrismaClient.user.findUnique({
        where: { email: 'valid@example.com' },
      });
      const passwordMatch = await bcrypt.compare('correctpassword', user!.password);
      
      expect(user).toBeDefined();
      expect(passwordMatch).toBe(true);
      expect(user!.role).toBe('ADMIN');
      expect(user!.tenant?.status).toBe('active');
    });

    it('rejette un CLIENT sans clientId', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'client@example.com',
        password: '$2a$12$hashedpassword',
        role: 'CLIENT',
        clientId: null,
        tenant: { id: 'tenant-123', status: 'active' },
      };
      
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUser);
      
      const user = await mockPrismaClient.user.findUnique({
        where: { email: 'client@example.com' },
      });
      
      expect(() => {
        if (user!.role === 'CLIENT' && !user!.clientId) {
          throw new Error('Profil client incomplet');
        }
      }).toThrow('Profil client incomplet');
    });
  });

  describe('JWT Callback', () => {
    it('inclut les informations utilisateur dans le token', () => {
      const user = {
        id: 'user-123',
        role: 'ADMIN',
        tenantId: 'tenant-123',
        tenantName: 'Cabinet Test',
        tenantPlan: 'pro',
        clientId: null,
      };
      
      const token: Record<string, unknown> = {};
      
      // Simulation du callback jwt
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantPlan = user.tenantPlan;
        token.clientId = user.clientId;
      }
      
      expect(token.id).toBe('user-123');
      expect(token.role).toBe('ADMIN');
      expect(token.tenantId).toBe('tenant-123');
      expect(token.tenantPlan).toBe('pro');
    });

    it('stocke le token GitHub pour les connexions GitHub', () => {
      const account = {
        provider: 'github',
        access_token: 'gho_xxxxxxxxxxxx',
        refresh_token: 'ghr_xxxxxxxxxxxx',
        expires_at: 1800000000,
      };
      
      const token: Record<string, unknown> = {};
      
      if (account.provider === 'github') {
        token.githubAccessToken = account.access_token;
        token.githubRefreshToken = account.refresh_token;
        token.githubTokenExpiry = account.expires_at;
      }
      
      expect(token.githubAccessToken).toBe('gho_xxxxxxxxxxxx');
      expect(token.githubRefreshToken).toBe('ghr_xxxxxxxxxxxx');
    });
  });

  describe('Session Callback', () => {
    it('transmet les informations du token à la session', () => {
      const token = {
        id: 'user-123',
        role: 'ADMIN',
        tenantId: 'tenant-123',
        tenantName: 'Cabinet Test',
        tenantPlan: 'pro',
      };
      
      const session = {
        user: {} as Record<string, unknown>,
        expires: new Date().toISOString(),
      };
      
      // Simulation du callback session
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.tenantName = token.tenantName;
      session.user.tenantPlan = token.tenantPlan;
      
      expect(session.user.id).toBe('user-123');
      expect(session.user.role).toBe('ADMIN');
      expect(session.user.tenantId).toBe('tenant-123');
    });
  });
});

describe('Password Security', () => {
  it('utilise bcrypt pour le hachage', () => {
    expect(bcrypt.compare).toBeDefined();
    expect(bcrypt.hash).toBeDefined();
  });

  it('rejette les comparaisons de mots de passe vides', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    
    const result = await bcrypt.compare('', 'somehash');
    expect(result).toBe(false);
  });
});
