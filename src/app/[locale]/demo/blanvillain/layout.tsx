import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démo MemoLib — Cabinet Blanvillain, Metz',
  description: 'Découvrez comment MemoLib simplifie la gestion de vos dossiers OQTF, titres de séjour et rétention. Démo personnalisée pour le Cabinet Émilie Blanvillain.',
  robots: { index: false, follow: false },
};

export default function DemoBlanvillainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
