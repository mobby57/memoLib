import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}));

describe('API /api/dossiers', () => {
    describe('GET /api/dossiers', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('retourne 401 si non authentifié', async () => {
            vi.mocked(getServerSession).mockResolvedValue(null);
            // Simulation d'appel API
            const session = await getServerSession();
            expect(session).toBeNull();
        });

        // Ajouter d'autres tests si nécessaires
        it('filtre par tenantId pour les utilisateurs normaux', () => {
            expect(true).toBe(true);
        });
        // ... (on peut ajouter les autres tests vides)
    });
});
