'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { SidebarLayoutAdjuster } from '@/components/SidebarLayoutAdjuster';
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette';
import { CommandPalette } from '@/components/CommandPalette';
import { ActivityMonitor } from '@/components/ActivityMonitor';
import { SessionTimeoutMonitor } from '@/components/SessionTimeoutMonitor';
import NotificationCenter from '@/components/NotificationCenter';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Pages qui doivent s'afficher en plein ecran sans sidebar
const FULLSCREEN_PAGES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/login',
  '/register',
];

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  // Attendre l'hydratation pour �viter les mismatches SSR/client
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Verifier si la page courante doit etre en plein ecran
  const isFullscreenPage = FULLSCREEN_PAGES.some(
    page => pathname === page || pathname?.startsWith('/auth/')
  );

  // Pendant l'hydratation, retourner un layout minimal coh�rent
  if (!isHydrated) {
    return (
      <main className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    );
  }

  // Mode plein ecran : pas de sidebar, pas de marges
  if (isFullscreenPage) {
    return (
      <main className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  // Mode normal avec sidebar et navigation
  return (
    <>
      <SidebarLayoutAdjuster />
      <Navigation />

      {/* Session Timeout Monitor - Securite inactivite 1h */}
      <SessionTimeoutMonitor />

      {/* Real-time Notification Center - Fixed top-right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationCenter />
      </div>

      <main className="lg:ml-64 min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
        <GlobalCommandPalette />
        <CommandPalette />
        <ActivityMonitor />
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </>
  );
}
