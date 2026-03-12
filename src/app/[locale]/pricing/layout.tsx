import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Tarifs MemoLib pour cabinets d\'avocats',
    description:
      'Comparez les offres MemoLib pour avocats indépendants, cabinets et structures multi-utilisateurs avec essai gratuit.',
    path: '/pricing',
    locale: params.locale,
    keywords: ['tarif logiciel avocat', 'prix CRM avocat', 'abonnement logiciel juridique'],
  });
}

export default function PricingLayout({
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
        name: 'Tarifs',
        item: '/fr/pricing',
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