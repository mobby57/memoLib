import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  return createPageMetadata({
    title: 'Simulation locale de message — MemoLib',
    description:
      'Testez une simulation locale sur des données fictives. Aucun email n’est envoyé et aucun délai juridique n’est calculé.',
    path: '/demo/email-simulator',
    locale: params.locale,
    keywords: ['simulation locale', 'démonstration MemoLib'],
  });
}

export default function DemoEmailSimulatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
