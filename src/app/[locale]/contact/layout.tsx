import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Contact MemoLib',
    description:
      'Contactez l\'équipe MemoLib pour une démo, une question produit ou un accompagnement sur votre cabinet.',
    path: '/contact',
    locale: params.locale,
    keywords: ['contact MemoLib', 'démo logiciel avocat', 'support logiciel juridique'],
  });
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Demo',
        item: '/fr/demo',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contact',
        item: '/fr/contact',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}