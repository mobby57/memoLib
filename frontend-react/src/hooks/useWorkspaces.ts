import { useState, useEffect, useCallback } from 'react';
import { workspaceAPI } from '../services/api';
import { Workspace } from '../types/workspace';

interface UseWorkspacesResult {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useWorkspaces = (): UseWorkspacesResult => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workspaceAPI.getAll();
      setWorkspaces(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des workspaces';
      setError(errorMessage);
      console.error('Error fetching workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return {
    workspaces,
    loading,
    error,
    refetch: fetchWorkspaces,
  };
};
