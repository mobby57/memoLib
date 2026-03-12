import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Démo Interactive MemoLib pour cabinets d\'avocats',
    description:
      'Découvrez MemoLib en action : tri intelligent des emails, analyse IA des dossiers et génération de documents juridiques.',
    path: '/demo',
    locale: params.locale,
    keywords: [
      'demo logiciel avocat',
      'démo CRM avocat',
      'analyse IA juridique',
      'automatisation emails juridiques',
    ],
  });
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MemoLib',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '99',
              priceCurrency: 'EUR',
              priceValidUntil: '2026-12-31',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '127',
            },
            description: 'Logiciel de gestion pour cabinets d\'avocats avec tri automatique emails, analyse IA et génération de documents légaux.',
            featureList: [
              'Tri automatique des emails',
              'Analyse IA des dossiers',
              'Génération documents légaux',
              'Conformité RGPD',
              'Gestion clientèle',
              'Facturation intégrée'
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
