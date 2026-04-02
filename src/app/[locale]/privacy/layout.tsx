import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return createPageMetadata({
    title: 'Confidentialité et droits RGPD',
    description:
      'Consultez les droits RGPD disponibles dans MemoLib pour l\'export et la suppression des données personnelles.',
    path: '/privacy',
    locale,
    noIndex: true,
  });
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}