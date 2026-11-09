const fs = require('fs');

const content = `'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { SidebarLayoutAdjuster } from '@/components/SidebarLayoutAdjuster';
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette';
import { CommandPalette } from '@/components/CommandPalette';
import { CommandPaletteGlobal } from '@/components/CommandPaletteGlobal';
import { ActivityMonitor } from '@/components/ActivityMonitor';
import NotificationCenter from '@/components/NotificationCenter';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

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

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isFullscreenPage = FULLSCREEN_PAGES.some(
    page => pathname === page || pathname?.startsWith('/auth/')
  ) || pathname?.includes('/auth/') || pathname?.includes('/demo/') || pathname === '/fr' || pathname === '/en';

  if (!isHydrated) {
    if (isFullscreenPage) {
      return (
        <main className="min-h-screen w-full">
          {children}
        </main>
      );
    }
    return (
      <main className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    );
  }

  if (isFullscreenPage) {
    return (
      <main className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  return (
    <>
      <SidebarLayoutAdjuster />
      <Navigation />
      <div className="fixed top-4 right-4 z-50">
        <NotificationCenter />
      </div>
      <main className="lg:ml-64 min-h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300">
        <CommandPaletteGlobal />
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
`;

fs.writeFileSync('src/components/LayoutWrapper.tsx', content, 'utf8');
console.log('✅ LayoutWrapper.tsx réécrit (' + content.length + ' octets)');
