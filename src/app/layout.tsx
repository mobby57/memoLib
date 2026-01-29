import Providers from './providers';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata = {
  title: 'Memolib',
  description: 'Démo prête pour la vente: paiements, analytics, admin.',
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
