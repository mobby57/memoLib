'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';

type ConnectedProvider = {
  provider: string;
  scope?: string;
  connectedAt: string;
  lastUsedAt?: string;
};

export function useConnectedProviders() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ConnectedProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/oauth/tokens');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tokens');
      setProviders(data.tokens || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const revoke = useCallback(async (provider: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/oauth/tokens?provider=${provider}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke');

      // Remove from list
      setProviders(p => p.filter(x => x.provider !== provider));
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [session?.user, refresh]);

  return { providers, loading, error, refresh, revoke };
}
