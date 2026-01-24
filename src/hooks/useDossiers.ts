import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';

interface Dossier {
  id: string;
  numero: string;
  type_dossier: string;
  statut: string;
  client_id: string;
  client_nom?: string;
  date_creation: string;
  date_echeance?: string;
  notes?: string;
}

interface CreateDossierData {
  client_id: string;
  type_dossier: string;
  statut?: string;
  date_echeance?: string;
  notes?: string;
}

export function useDossiers(options?: { statut?: string; search?: string }) {
  const { getTenantApiUrl } = useTenant();
  const queryClient = useQueryClient();

  const apiUrl = getTenantApiUrl('/dossiers');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dossiers', options],
    queryFn: async () => {
      if (!apiUrl) throw new Error('Tenant ID manquant');

      const params = new URLSearchParams();
      if (options?.statut) params.append('statut', options.statut);
      if (options?.search) params.append('search', options.search);

      const response = await fetch(`${apiUrl}?${params}`);
      if (!response.ok) throw new Error('Erreur chargement dossiers');
      return response.json();
    },
    enabled: !!apiUrl,
  });

  const createMutation = useMutation({
    mutationFn: async (newDossier: CreateDossierData) => {
      if (!apiUrl) throw new Error('Tenant ID manquant');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDossier),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur creation dossier');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    dossiers: data?.data || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    createDossier: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
