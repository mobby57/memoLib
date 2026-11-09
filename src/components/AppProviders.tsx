'use client';

import { ToastProvider } from '@/components/ui/Toast';
import { NotificationProvider } from '@/components/NotificationProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ToastProvider>
  );
}
