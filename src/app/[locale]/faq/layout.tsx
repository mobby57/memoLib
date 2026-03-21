import type { Metadata } from 'next';
import { createPageMetadata, getBaseUrl } from '@/lib/metadata';

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return createPageMetadata({
    title: 'FAQ MemoLib',
    description:
      'Retrouvez les réponses sur la sécurité, le RGPD, la tarification et les fonctionnalités MemoLib pour cabinets d\'avocats.',
    path: '/faq',
    locale: params.locale,
    keywords: ['faq logiciel avocat', 'rgpd cabinet avocat', 'sécurité SaaS juridique'],
  });
}

export default function FaqLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const baseUrl = getBaseUrl();
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: "Qu'est-ce que MemoLib exactement ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'MemoLib est un logiciel de gestion de cabinet juridique spécialisé en droit des étrangers, avec automatisation des emails et suivi des dossiers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Mes données clients sont-elles sécurisées ? ',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui. Les données sont isolées par cabinet, chiffrées, et hébergées sur une infrastructure conforme RGPD.',
        },
      },
      {
        '@type': 'Question',
        name: "Y a-t-il une période d'essai gratuite ?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Oui, un essai gratuit de 14 jours est disponible pour tester les fonctionnalités en conditions réelles.',
        },
      },
      {
        '@type': 'Question',
        name: 'Le système peut-il remplacer un avocat ? ',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Non. MemoLib est un assistant et ne remplace jamais la validation humaine dans les décisions juridiques.',
        },
      },
    ],
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Demo',
        item: `${baseUrl}/${params.locale}/demo`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'FAQ',
        item: `${baseUrl}/${params.locale}/faq`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}