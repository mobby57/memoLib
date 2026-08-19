import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démo MemoLib — Cabinet Boudhane, Metz',
  description: 'Découvrez comment MemoLib simplifie la gestion de vos dossiers en droit des étrangers, droit public et contentieux administratif. Démo personnalisée pour Me Saïda Boudhane.',
  robots: { index: false, follow: false },
};

export default function DemoBoudhaneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
