import type { Metadata } from 'next';
import { createPageMetadata, getBaseUrl } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    title: 'Tarifs MemoLib pour cabinets d\'avocats',
    description:
      'Comparez les offres MemoLib pour avocats indépendants, cabinets et structures multi-utilisateurs avec essai gratuit.',
    path: '/pricing',
    locale,
    keywords: ['tarif logiciel avocat', 'prix CRM avocat', 'abonnement logiciel juridique'],
  });
}

export default async function PricingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const baseUrl = getBaseUrl();
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Demo',
        item: `${baseUrl}/${locale}/demo`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Tarifs',
        item: `${baseUrl}/${locale}/pricing`,
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