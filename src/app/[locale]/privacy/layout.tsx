import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Confidentialité et droits RGPD',
    description:
      'Consultez les droits RGPD disponibles dans MemoLib pour l\'export et la suppression des données personnelles.',
    path: '/privacy',
    locale: params.locale,
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