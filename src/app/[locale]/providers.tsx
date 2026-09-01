'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SessionTimeoutManager } from '@/components/SessionTimeoutManager';
import { NotificationProvider } from '@/components/NotificationProvider';
import { ToastProvider } from '@/components/ui/Toast';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
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
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <NotificationProvider>
          <SessionTimeoutManager />
          {children}
        </NotificationProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

