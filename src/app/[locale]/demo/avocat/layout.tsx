import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démo interactive — MemoLib pour avocats',
  description: 'Voyez comment MemoLib traite un dossier OQTF en 45 secondes : email → IA → dossier → document. Essai gratuit 14 jours.',
};

export default function DemoAvocatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
