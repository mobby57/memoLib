import type { MetadataRoute } from 'next';
import { getBaseUrl, SUPPORTED_LOCALES } from '@/lib/metadata';

const PUBLIC_ROUTES = [
  { path: '/demo', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  return SUPPORTED_LOCALES.flatMap(locale =>
    PUBLIC_ROUTES.map(route => ({
      url: `${baseUrl}/${locale}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: Object.fromEntries(
          SUPPORTED_LOCALES.map(altLocale => [altLocale, `${baseUrl}/${altLocale}${route.path}`])
        ),
      },
    }))
  );
}