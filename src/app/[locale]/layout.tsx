import type { Metadata } from 'next';
import { defaultMetadata, getBaseUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/metadata';
import './globals.css';

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Legal Practice Management',
    operatingSystem: 'Web',
    url: getBaseUrl(),
    description: SITE_DESCRIPTION,
    offers: [
      {
        '@type': 'Offer',
        name: 'Pilote',
        price: '0',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        description: 'Essai gratuit 30 jours',
      },
      {
        '@type': 'Offer',
        name: 'Professionnel',
        price: '39',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        description: 'Pour les avocats ind\u00e9pendants',
      },
      {
        '@type': 'Offer',
        name: 'Cabinet',
        price: '149',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        description: 'Pour les cabinets multi-avocats',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '12',
    },
  };

  return (
    <html lang={locale}>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {children}
      </body>
    </html>
  );
}