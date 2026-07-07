import { getBaseUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/metadata';
import { Providers } from './providers';
import { LayoutWrapper } from '@/components/LayoutWrapper';
import ConsentBanner from '@/components/compliance/ConsentBanner';
import './globals.css';

export default async function LocaleLayout({
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
    operatingSystem: 'Web',
    url: getBaseUrl(),
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <Providers>
        <LayoutWrapper>{children}</LayoutWrapper>
        <ConsentBanner />
      </Providers>
    </>
  );
}
