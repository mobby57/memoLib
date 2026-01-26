// Métadonnées partagées pour toutes les pages
// https://nextjs.org/docs/app/getting-started/metadata-and-og-images

import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://iapostemanager.com';

// Métadonnées par défaut
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'IA Poste Manager - Gestion Juridique Intelligente',
    template: '%s | IA Poste Manager',
  },
  description: 'Système intelligent de gestion des dossiers juridiques pour cabinets d\'avocats. Multi-tenant, sécurisé et optimisé par IA.',
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
  authors: [{ name: 'IA Poste Manager Team' }],
  creator: 'IA Poste Manager',
  publisher: 'IA Poste Manager',
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
    siteName: 'IA Poste Manager',
    title: 'IA Poste Manager - Gestion Juridique Intelligente',
    description: 'Système intelligent de gestion des dossiers juridiques pour cabinets d\'avocats.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'IA Poste Manager',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IA Poste Manager - Gestion Juridique Intelligente',
    description: 'Système intelligent de gestion des dossiers juridiques.',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@iapostemanager',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: BASE_URL,
  },
};

// Fonction helper pour créer des métadonnées de page
export function createPageMetadata(
  title: string,
  description?: string,
  path?: string
): Metadata {
  return {
    title,
    description: description || defaultMetadata.description,
    alternates: path ? { canonical: `${BASE_URL}${path}` } : undefined,
    openGraph: {
      title,
      description: description || (defaultMetadata.description as string),
      url: path ? `${BASE_URL}${path}` : undefined,
    },
  };
}

// Métadonnées spécifiques par section
export const sectionMetadata = {
  dashboard: createPageMetadata(
    'Tableau de bord',
    'Gérez vos dossiers, clients et activités depuis votre tableau de bord.',
    '/dashboard'
  ),
  dossiers: createPageMetadata(
    'Dossiers',
    'Gestion complète de vos dossiers juridiques avec suivi et historique.',
    '/dossiers'
  ),
  clients: createPageMetadata(
    'Clients',
    'Base de données clients avec historique et documents associés.',
    '/clients'
  ),
  factures: createPageMetadata(
    'Facturation',
    'Créez et gérez vos factures avec calcul automatique des honoraires.',
    '/factures'
  ),
  documents: createPageMetadata(
    'Documents',
    'Gestion documentaire avec recherche IA et OCR intégré.',
    '/documents'
  ),
  settings: createPageMetadata(
    'Paramètres',
    'Configurez votre espace de travail et vos préférences.',
    '/settings'
  ),
};
