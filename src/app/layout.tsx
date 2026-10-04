import type { Metadata } from 'next';

import { defaultMetadata } from '@/lib/metadata';
import CrispChat from '@/components/support/CrispChat';

export const metadata: Metadata = defaultMetadata;

// Next 16 : force le rendu dynamique de tout l'arbre. MemoLib est une app SaaS
// authentifiée (quasi aucune page statique), et cela évite l'échec de prerender
// des routes synthétiques (/_global-error, /_not-found) qui jetaient
// "Cannot read properties of null (reading 'useContext')" au build.
export const dynamic = 'force-dynamic';

// NOTE: ClerkProvider intentionally lives in the `[locale]` layout, NOT here.
// Under Next 16, keeping ClerkProvider at the root caused it to be evaluated
// during the static prerender of synthetic routes (/_global-error, /_not-found)
// and the `/` redirect page, where there is no request context. React then threw
// "Cannot read properties of null (reading 'useContext')" and failed the
// production build. The real application lives under `[locale]`, which is where
// Clerk's auth context is actually needed, so the provider is scoped there.
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
