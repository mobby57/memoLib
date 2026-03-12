import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES } from '@/lib/metadata';

const PRIVATE_SECTIONS = [
  '/api/',
  '/admin/',
  '/super-admin/',
  '/dashboard/',
  '/workspaces/',
  '/dossiers/',
  '/documents/',
  '/factures/',
  '/clients/',
  '/settings/',
  '/auth/',
  '/login',
  '/dev/',
  '/test/',
  '/test-login/',
  '/_next/',
  '/static/',
];

export default function robots(): MetadataRoute.Robots {
  const localizedPrivateSections = SUPPORTED_LOCALES.flatMap(locale =>
    PRIVATE_SECTIONS.map(path => `/${locale}${path.startsWith('/') ? path : `/${path}`}`)
  );

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [...PRIVATE_SECTIONS, ...localizedPrivateSections],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [...PRIVATE_SECTIONS, ...localizedPrivateSections],
      },
    ],
    sitemap: `${getBaseUrl()}/sitemap.xml`,
  };
}