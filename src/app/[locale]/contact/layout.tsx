import type { Metadata } from 'next';
import { createPageMetadata, getBaseUrl } from '@/lib/metadata';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    title: 'Contact MemoLib',
    description:
      'Contactez l\'équipe MemoLib pour une démo, une question produit ou un accompagnement sur votre cabinet.',
    path: '/contact',
    locale,
    keywords: ['contact MemoLib', 'démo logiciel avocat', 'support logiciel juridique'],
  });
}

export default async function ContactLayout({
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
        name: 'Contact',
        item: `${baseUrl}/${locale}/contact`,
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