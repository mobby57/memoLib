import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Demo Email Simulator - MemoLib',
    description:
      'Simulez des emails clients realistes pour evaluer le tri automatique, la priorisation et la creation de workflow juridique dans MemoLib.',
    path: '/demo/email-simulator',
    locale: params.locale,
    keywords: ['simulateur email avocat', 'tri email juridique', 'demo workflow juridique'],
  });
}

export default function DemoEmailSimulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
