import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from '@vercel/analytics/next';

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
        <ClerkProvider>
          {children}
          <CrispChat />
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}