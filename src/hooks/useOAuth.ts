'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

type OAuthProvider = 'google' | 'microsoft' | 'github';

type UseOAuthOptions = {
  provider: OAuthProvider;
  scopes?: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
};

export function useOAuth({ provider, scopes, onSuccess, onError }: UseOAuthOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAuthUrl = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const state = Math.random().toString(36).substring(7);
      // Store state in sessionStorage for verification in callback
      sessionStorage.setItem(`oauth_state_${provider}`, state);

      const res = await fetch(
        `/api/oauth/authorize?provider=${provider}&state=${state}` +
        (scopes ? `&scopes=${scopes.join(',')}` : '')
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get auth URL');

      return data.authUrl;
    } catch (e: any) {
      const error = new Error(e.message || 'OAuth error');
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [provider, scopes, onError]);

  const startLogin = useCallback(async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (e: any) {
      // Error already handled in getAuthUrl
    }
  }, [getAuthUrl]);

  const handleCallback = useCallback(
    async (code: string) => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/oauth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, code }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Callback failed');

        onSuccess?.(data);
        router.refresh();
        return data;
      } catch (e: any) {
        const error = new Error(e.message);
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [provider, onSuccess, onError, router]
  );

  return {
    loading,
    error,
    startLogin,
    handleCallback,
    getAuthUrl,
  };
}
