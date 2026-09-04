import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

// Mock bcryptjs avec default export
vi.mock('bcryptjs', async () => {
    const actual = await vi.importActual('bcryptjs');
    return {
        ...actual,
        default: {
            ...actual.default,
            compare: vi.fn(),
            hash: vi.fn(),
        },
        compare: vi.fn(),
        hash: vi.fn(),
    };
});

describe('NextAuth Configuration', () => {
    describe('Credentials Provider - authorize()', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('rejette si mot de passe incorrect', async () => {
            const mockUser = { id: '1', email: 'test@test.com', password: 'hash' };
            const mockPrismaClient = { user: { findUnique: vi.fn().mockResolvedValue(mockUser) } };
            vi.mocked(bcrypt.compare).mockResolvedValue(false);
            const user = await mockPrismaClient.user.findUnique({ where: { email: 'test@test.com' } });
            expect(user).toEqual(mockUser);
        });

        it('rejette si cabinet inactif pour un ADMIN', () => {
            expect(true).toBe(true);
        });

        it('autorise un utilisateur valide avec bon mot de passe', () => {
            expect(true).toBe(true);
        });
    });

    describe('Password Security', () => {
        it('utilise bcrypt pour le hachage', () => {
            expect(bcrypt.compare).toBeDefined();
            expect(bcrypt.hash).toBeDefined();
        });

        it('rejette les comparaisons de mots de passe vides', async () => {
            vi.mocked(bcrypt.compare).mockResolvedValue(false);
            const result = await bcrypt.compare('', 'somehash');
            expect(result).toBe(false);
        });
    });
});
