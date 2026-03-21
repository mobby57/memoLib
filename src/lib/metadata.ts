// Metadonnees partagees pour toutes les pages
// https://nextjs.org/docs/app/getting-started/metadata-and-og-images

import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memoLib.com';

export const SITE_NAME = 'memoLib';
export const SITE_DESCRIPTION =
  'Systeme intelligent de gestion des dossiers juridiques pour cabinets d\'avocats. Multi-tenant, securise et optimise par IA.';
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export interface CreatePageMetadataInput {
  title: string;
  description?: string;
  path?: string;
  locale?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function getBaseUrl(): string {
  return BASE_URL;
}

// Metadonnees par defaut
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'memoLib - Gestion Juridique Intelligente',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'gestion juridique',
    'cabinet avocat',
    'dossiers juridiques',
    'IA',
    'intelligence artificielle',
    'multi-tenant',
    'SaaS juridique',
    'facturation avocat',
  ],
  authors: [{ name: 'memoLib Team' }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: BASE_URL,
    siteName: SITE_NAME,
    title: 'memoLib - Gestion Juridique Intelligente',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'memoLib - Gestion Juridique Intelligente',
    description: SITE_DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
    creator: '@memoLib',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
  },
};

function normalizePath(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function toOpenGraphLocale(locale?: string): string {
  if (locale === 'en') {
    return 'en_US';
  }

  return 'fr_FR';
}

// Surcharge: signature historique (title, description, path)
export function createPageMetadata(
  title: string,
  description?: string,
  path?: string
): Metadata;

// Surcharge: signature objet pour layouts localises
export function createPageMetadata(input: CreatePageMetadataInput): Metadata;

export function createPageMetadata(
  inputOrTitle: string | CreatePageMetadataInput,
  description?: string,
  path?: string
): Metadata {
  const input: CreatePageMetadataInput =
    typeof inputOrTitle === 'string'
      ? { title: inputOrTitle, description, path }
      : inputOrTitle;

  const finalDescription = input.description || (defaultMetadata.description as string);
  const normalizedPath = normalizePath(input.path);
  const localizedPath =
    normalizedPath && input.locale ? `/${input.locale}${normalizedPath}` : normalizedPath;
  const canonical = localizedPath ? `${BASE_URL}${localizedPath}` : undefined;
  const languages = normalizedPath
    ? Object.fromEntries(
        SUPPORTED_LOCALES.map(locale => [locale, `${BASE_URL}/${locale}${normalizedPath}`])
      )
    : undefined;

  return {
    title: input.title,
    description: finalDescription,
    keywords: input.keywords,
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
    alternates: canonical
      ? {
          canonical,
        languages,
        }
      : undefined,
    openGraph: {
      title: input.title,
      description: finalDescription,
      url: canonical,
      type: 'website',
      locale: toOpenGraphLocale(input.locale),
      siteName: SITE_NAME,
    },
  };
}

export const sectionMetadata: Record<string, Metadata> = {
  dashboard: createPageMetadata(
    'Tableau de bord',
    'Vue d\'ensemble de votre activite juridique et indicateurs cles.',
    '/dashboard'
  ),
  dossiers: createPageMetadata(
    'Dossiers',
    'Gestion complete de vos dossiers juridiques avec suivi et historique.',
    '/dossiers'
  ),
  clients: createPageMetadata(
    'Clients',
    'Base de donnees clients avec historique et documents associes.',
    '/clients'
  ),
  factures: createPageMetadata(
    'Facturation',
    'Creez et gerez vos factures avec calcul automatique des honoraires.',
    '/factures'
  ),
  documents: createPageMetadata(
    'Documents',
    'Gestion documentaire avec recherche IA et OCR integre.',
    '/documents'
  ),
  settings: createPageMetadata(
    'Paramètres',
    'Configurez votre espace de travail et vos preferences.',
    '/settings'
  ),
};
