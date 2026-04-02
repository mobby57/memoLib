import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    title: 'Demo Preuve Légale - MemoLib',
    description:
      'Explorez la generation de preuves legales, le controle de conformité et la preparation de documents juridiques dans MemoLib.',
      path: '/demo/legal-proof',
    locale,
    keywords: ['preuve légale numerique', 'generation document juridique', 'conformité dossier avocat'],
  });
}

export default function DemoLegalProofLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
