import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from './useTenant';

interface Facture {
  id: string;
  numero: string;
  client_id: string;
  client_nom?: string;
  montant_total: number;
  montant_paye: number;
  statut: string;
  date_emission: string;
  date_echeance: string;
}

interface CreateFactureData {
  client_id: string;
  montant_total: number;
  date_echeance: string;
  description?: string;
  statut?: string;
}

export function useFactures(options?: { statut?: string; client_id?: string }) {
  const { getTenantApiUrl } = useTenant();
  const queryClient = useQueryClient();

  const apiUrl = getTenantApiUrl('/factures');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['factures', options],
    queryFn: async () => {
      if (!apiUrl) throw new Error('Tenant ID manquant');

      const params = new URLSearchParams();
      if (options?.statut) params.append('statut', options.statut);
      if (options?.client_id) params.append('client_id', options.client_id);

      const response = await fetch(`${apiUrl}?${params}`);
      if (!response.ok) throw new Error('Erreur chargement factures');
      return response.json();
    },
    enabled: !!apiUrl,
  });

  const createMutation = useMutation({
    mutationFn: async (newFacture: CreateFactureData) => {
      if (!apiUrl) throw new Error('Tenant ID manquant');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFacture),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur création facture');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factures'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const totalFacture = data?.data?.reduce(
    (sum: number, f: Facture) => sum + f.montant_total,
    0
  ) || 0;

  const totalPaye = data?.data?.reduce(
    (sum: number, f: Facture) => sum + f.montant_paye,
    0
  ) || 0;

  return {
    factures: data?.data || [],
    total: data?.total || 0,
    totalFacture,
    totalPaye,
    totalImpaye: totalFacture - totalPaye,
    isLoading,
    error,
    refetch,
    createFacture: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
