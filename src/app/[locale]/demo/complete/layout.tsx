import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return createPageMetadata({
    title: 'Parcours de démonstration MemoLib',
    description:
      'Parcours guidé de maquette locale utilisant uniquement des exemples fictifs, sans traitement ni validation juridique.',
    path: '/demo/complete',
    locale: params.locale,
    keywords: ['démonstration MemoLib', 'maquette interactive'],
  });
}

export default function DemoCompleteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
