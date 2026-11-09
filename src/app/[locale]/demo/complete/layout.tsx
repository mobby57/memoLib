import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Demo complete MemoLib',
    description:
      'Parcours guide complet pour comprendre comment utiliser MemoLib: onboarding, gestion quotidienne, automatisation et bonnes pratiques.',
    path: '/demo/complete',
    locale: params.locale,
    keywords: ['demo complete logiciel avocat', 'onboarding memolib', 'guide utilisation memolib'],
  });
}

export default function DemoCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
