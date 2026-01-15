'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SessionTimeoutManager } from '@/components/SessionTimeoutManager';
import { NotificationProvider } from '@/components/NotificationProvider';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useMemo(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes
          refetchOnWindowFocus: false,
          refetchOnReconnect: 'always',
          retry: (failureCount, error: any) => {
            if (error?.status === 404) return false;
            return failureCount < 2;
          },
        },
        mutations: {
          retry: 1,
        },
      },
    }),
    []
  );

  return (
    <SessionProvider 
      basePath="/api/auth"
      refetchInterval={5 * 60} // 5 minutes
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <SessionTimeoutManager />
          {children}
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
