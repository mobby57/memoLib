import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'Programme Pilote Gratuit — MemoLib pour Cabinets d\'Avocats',
    description:
      'Testez MemoLib gratuitement pendant 30 jours. Aucune carte bancaire requise. IA juridique, gestion emails et dossiers pour votre cabinet.',
    path: '/pilote',
    locale: params.locale,
    keywords: [
      'logiciel avocat gratuit',
      'essai gratuit cabinet avocat',
      'gestion emails avocat',
      'IA juridique essai',
      'CRM avocat gratuit',
      'pilote logiciel juridique',
    ],
  });
}

export default function PiloteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MemoLib — Programme Pilote',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
              description: 'Essai gratuit 30 jours sans carte bancaire',
              priceValidUntil: '2026-12-31',
            },
            featureList: [
              'Tri automatique des emails clients',
              'Extraction IA des informations',
              'Création de dossiers en 1 clic',
              'Conformité RGPD',
              '5 dossiers et 5 clients inclus',
            ],
          }),
        }}
      />
      {children}
    </>
  );
}
