import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/tokens/tokens.css';
import '@/styles/sidebar.css';
import { Providers } from './providers';
import { Navigation } from '@/components/Navigation';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { GlobalCommandPalette } from '@/components/GlobalCommandPalette';
import { SidebarLayoutAdjuster } from '@/components/SidebarLayoutAdjuster';
import { CommandPalette } from '@/components/CommandPalette';
import { ActivityMonitor } from '@/components/ActivityMonitor';
import NotificationCenter from '@/components/NotificationCenter';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata: Metadata = {
  title: 'IA Poste Manager - Gestion Multi-Tenant',
  description: 'Système intelligent de gestion des dossiers juridiques pour cabinets d\'avocats',
  keywords: 'gestion juridique, IA, multi-tenant, avocats',
  authors: [{ name: 'IA Poste Manager' }],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body className={`${inter.className} gpu-accelerated`} suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <Providers>
              <SidebarLayoutAdjuster />
              <Navigation />
              
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
              <ServiceWorkerRegistration />
            </Providers>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
