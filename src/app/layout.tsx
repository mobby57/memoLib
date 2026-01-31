import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import '@/styles/tokens/tokens.css';
import '@/styles/sidebar.css';
import { Providers } from './providers';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';

// Force dynamic rendering for all pages to prevent SSG prerender errors
export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'memoLib - Gestion Multi-Tenant',
  description: "Systeme intelligent de gestion des dossiers juridiques pour cabinets d'avocats",
  keywords: 'gestion juridique, IA, multi-tenant, avocats',
  authors: [{ name: 'memoLib' }],
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3b82f6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} gpu-accelerated`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            <Providers>
              <LayoutWrapper>{children}</LayoutWrapper>
              <ServiceWorkerRegistration />
              <WebVitalsReporter />
            </Providers>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
