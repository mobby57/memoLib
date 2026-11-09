import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — MemoLib',
  description: 'Connectez-vous à votre espace MemoLib pour gérer vos dossiers, clients et échéances.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
