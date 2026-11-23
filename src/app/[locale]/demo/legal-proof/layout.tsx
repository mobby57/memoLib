import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return createPageMetadata({
    title: 'Exemples fictifs de documents — MemoLib',
    description:
      'Prévisualisez ou téléchargez des exemples textuels fictifs, sans valeur juridique ni contrôle de conformité.',
    path: '/demo/legal-proof',
    locale: params.locale,
    keywords: ['exemples fictifs', 'démonstration MemoLib'],
  });
}

export default function DemoLegalProofLayout({ children }: { children: React.ReactNode }) {
  return children;
}
