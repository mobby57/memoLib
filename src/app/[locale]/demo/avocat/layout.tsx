import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démonstration MemoLib',
  description:
    'Parcours de démonstration avec des exemples fictifs, sans analyse IA ni traitement de dossier réel.',
  robots: { index: false, follow: false },
};

export default function DemoAvocatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
