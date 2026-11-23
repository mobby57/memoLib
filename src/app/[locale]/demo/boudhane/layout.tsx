import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Démonstration MemoLib',
  description: 'Parcours de démonstration générique avec des exemples fictifs.',
  robots: { index: false, follow: false },
};

export default function DemoBoudhaneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
