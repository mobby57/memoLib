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
    description: 'Découvrez MemoLib en action : tri intelligent des emails, analyse IA des dossiers et génération de documents.',
    path: '/demo',
    locale,
  });
}

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
