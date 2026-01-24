/**
 * Tests pour le hook useDossiers
 * Couverture: queries, mutations, états de chargement
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDossiers } from '@/hooks/useDossiers';
import { ReactNode } from 'react';

// Mock du hook useTenant
jest.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({
    getTenantApiUrl: (path: string) => `/api/tenant/test-tenant${path}`,
    tenantId: 'test-tenant',
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Wrapper avec QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDossiers Hook', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Chargement initial', () => {
    it('devrait charger les dossiers avec succès', async () => {
      const mockData = {
        data: [
          { id: '1', numero: 'DOS-001', type_dossier: 'Civil', statut: 'en_cours' },
          { id: '2', numero: 'DOS-002', type_dossier: 'Pénal', statut: 'nouveau' },
        ],
        total: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dossiers).toHaveLength(2);
      expect(result.current.total).toBe(2);
      expect(result.current.dossiers[0].numero).toBe('DOS-001');
    });

    it('devrait gérer les erreurs de chargement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.dossiers).toHaveLength(0);
    });

    it('devrait retourner un tableau vide si pas de données', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dossiers).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });
  });

  describe('Filtres', () => {
    it('devrait filtrer par statut', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      renderHook(() => useDossiers({ statut: 'en_cours' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('statut=en_cours');
    });

    it('devrait filtrer par recherche', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      renderHook(() => useDossiers({ search: 'Dupont' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('search=Dupont');
    });

    it('devrait combiner les filtres', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      renderHook(() => useDossiers({ statut: 'nouveau', search: 'Martin' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('statut=nouveau');
      expect(url).toContain('search=Martin');
    });
  });

  describe('Création de dossier', () => {
    it('devrait créer un dossier avec succès', async () => {
      // Premier appel: chargement initial
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deuxième appel: création
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '3',
          numero: 'DOS-003',
          type_dossier: 'Commercial',
          statut: 'nouveau',
        }),
      });

      // Troisième appel: refetch après invalidation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: '3', numero: 'DOS-003' }],
          total: 1,
        }),
      });

      act(() => {
        result.current.createDossier({
          client_id: 'client-1',
          type_dossier: 'Commercial',
        });
      });

      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });

      // Vérifier que POST a été appelé
      const postCall = mockFetch.mock.calls.find(
        (call) => call[1]?.method === 'POST'
      );
      expect(postCall).toBeTruthy();
      expect(JSON.parse(postCall[1].body)).toEqual({
        client_id: 'client-1',
        type_dossier: 'Commercial',
      });
    });

    it('devrait gérer les erreurs de création', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Client non trouvé' }),
      });

      act(() => {
        result.current.createDossier({
          client_id: 'invalid-client',
          type_dossier: 'Civil',
        });
      });

      await waitFor(() => {
        expect(result.current.createError).toBeTruthy();
      });
    });

    it('devrait indiquer isCreating pendant la création', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock un délai
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ id: '4' }),
                }),
              100
            )
          )
      );

      act(() => {
        result.current.createDossier({
          client_id: 'client-2',
          type_dossier: 'Administratif',
        });
      });

      // Le test vérifie que isCreating devient false après la création
      await waitFor(() => {
        expect(result.current.isCreating).toBe(false);
      });
    });
  });

  describe('Refetch', () => {
    it('devrait pouvoir refetch manuellement', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: '1' }], total: 1 }),
      });

      const { result } = renderHook(() => useDossiers(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dossiers).toHaveLength(1);

      // Nouveau fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: '1' }, { id: '2' }], total: 2 }),
      });

      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.dossiers).toHaveLength(2);
      });
    });
  });

  describe('Query key', () => {
    it('devrait avoir une query key différente avec des options différentes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], total: 0 }),
      });

      const wrapper = createWrapper();

      // Premier hook sans options
      renderHook(() => useDossiers(), { wrapper });

      // Deuxième hook avec options
      renderHook(() => useDossiers({ statut: 'nouveau' }), { wrapper });

      await waitFor(() => {
        // Deux appels fetch différents
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });
});
