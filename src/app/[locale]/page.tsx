import type { Metadata } from 'next';
import { HomePageContent } from './HomePageContent';
import { getBaseUrl } from '@/lib/metadata';

export const metadata: Metadata = {
  title: 'MemoLib — Logiciel IA pour cabinets d\'avocats | Droit des étrangers',
  description: 'MemoLib transforme vos emails en dossiers juridiques, calcule vos délais OQTF automatiquement et vous alerte avant chaque échéance. Spécialisé droit des étrangers et CESEDA.',
  keywords: [
    'logiciel avocat',
    'droit des étrangers',
    'OQTF',
    'CESEDA',
    'gestion cabinet avocat',
    'IA juridique',
    'logiciel juridique',
    'délais légaux',
    'gestion dossiers avocat',
  ],
  openGraph: {
    title: 'MemoLib — Logiciel IA pour cabinets d\'avocats',
    description: 'Email reçu. Dossier créé. Délai calculé. Le logiciel de gestion intelligent pour les avocats en droit des étrangers.',
    type: 'website',
    url: 'https://memolib.space',
    locale: 'fr_FR',
  },
  alternates: {
    canonical: 'https://memolib.space/fr',
    languages: {
      fr: 'https://memolib.space/fr',
      en: 'https://memolib.space/en',
    },
  },
};

export default function HomePage() {
  const baseUrl = getBaseUrl();
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MemoLib',
    url: baseUrl,
    logo: `${baseUrl}/favicon-96x96.png`,
    description: 'Logiciel de gestion intelligent pour cabinets d\'avocats spécialisés en droit des étrangers.',
    sameAs: ['https://github.com/mobby57/memoLib'],
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MemoLib',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: baseUrl,
    description: 'Logiciel IA de gestion de cabinet d\'avocat. Emails, dossiers, délais légaux, facturation.',
    offers: [
      { '@type': 'Offer', name: 'Essai', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      { '@type': 'Offer', name: 'Essentiel', price: '89', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
      { '@type': 'Offer', name: 'Cabinet', price: '69', priceCurrency: 'EUR', availability: 'https://schema.org/InStock' },
    ],
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', reviewCount: '3' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <HomePageContent />
    </>
  );
}
