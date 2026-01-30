import Providers from './providers';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'Memolib — Suite juridique augmentée',
  description:
    "Offrez une expérience juridique rassurante, personnelle et conforme. Memolib orchestre vos échanges, vos paiements et vos obligations réglementaires pour faire de chaque dossier un parcours fluide et sécurisé.",
  keywords: [
    'juridique',
    'RGPD',
    'cabinet',
    'onboarding',
    'paiements',
    'signature électronique',
    'tableaux de bord',
  ],
  metadataBase: new URL('http://localhost:3000'),
  themeColor: '#0ea5e9',
  openGraph: {
    title: 'Memolib — Suite juridique augmentée',
    description:
      "Offrez une expérience juridique rassurante, personnelle et conforme. Memolib orchestre vos échanges, vos paiements et vos obligations réglementaires pour faire de chaque dossier un parcours fluide et sécurisé.",
    url: 'http://localhost:3000/',
    siteName: 'Memolib',
    locale: 'fr_FR',
    images: [
      { url: '/apple-touch-icon.png', width: 180, height: 180, alt: 'Memolib' },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memolib — Suite juridique augmentée',
    description:
      "Offrez une expérience juridique rassurante, personnelle et conforme. Memolib orchestre vos échanges, vos paiements et vos obligations réglementaires pour faire de chaque dossier un parcours fluide et sécurisé.",
    images: ['/apple-touch-icon.png'],
  },
  icons: {
    icon: ['/favicon.ico', '/favicon-32x32.png', '/favicon-16x16.png'],
    apple: ['/apple-touch-icon.png'],
    shortcut: ['/favicon.ico']
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <NavBar />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
