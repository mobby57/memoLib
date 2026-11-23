import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    title: 'Démo',
    description:
      'Explorez une maquette interactive avec des exemples fictifs. Aucun email, dossier ou document juridique réel n’est traité.',
    path: '/demo',
    locale,
  });
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
