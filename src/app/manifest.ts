import type { MetadataRoute } from 'next';
import { getBaseUrl, SITE_DESCRIPTION, SITE_NAME } from '@/lib/metadata';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: '/fr/demo',
    scope: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    categories: ['business', 'productivity', 'legal'],
    lang: 'fr',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcuts: [
      {
        name: 'Demo',
        short_name: 'Demo',
        description: 'Decouvrir la demonstration MemoLib',
        url: '/fr/demo',
      },
      {
        name: 'Tarifs',
        short_name: 'Tarifs',
        description: 'Comparer les plans MemoLib',
        url: '/fr/pricing',
      },
      {
        name: 'Pilote Gratuit',
        short_name: 'Pilote',
        description: 'Essai gratuit 30 jours MemoLib',
        url: '/fr/pilote',
      },
      {
        name: 'Contact',
        short_name: 'Contact',
        description: 'Contacter l\'equipe MemoLib',
        url: '/fr/contact',
      },
    ],
    id: `${getBaseUrl()}/fr/demo`,
  };
}
