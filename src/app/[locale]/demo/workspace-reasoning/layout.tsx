import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return createPageMetadata({
    title: 'Exemple de parcours de traitement — MemoLib',
    description:
      'Visualisez un exemple prérempli de parcours. Aucune analyse IA ni création de dossier n’a lieu.',
    path: '/demo/workspace-reasoning',
    locale: params.locale,
    keywords: ['maquette interactive', 'démonstration MemoLib'],
  });
}

export default function DemoWorkspaceReasoningLayout({ children }: { children: React.ReactNode }) {
  return children;
}
