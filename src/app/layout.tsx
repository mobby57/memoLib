import type { Metadata } from 'next';
import { defaultMetadata } from '@/lib/metadata';
import CrispChat from '@/components/support/CrispChat';

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
        <CrispChat />
      </body>
    </html>
  );
}
