import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Demo Preuve Legale - MemoLib',
    description:
      'Explorez la generation de preuves legales, le controle de conformite et la preparation de documents juridiques dans MemoLib.',
    path: '/demo/legal-proof',
    locale: params.locale,
    keywords: ['preuve legale numerique', 'generation document juridique', 'conformite dossier avocat'],
  });
}

export default function DemoLegalProofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
