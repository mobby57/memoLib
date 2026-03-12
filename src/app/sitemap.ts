import type { MetadataRoute } from 'next';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { getBaseUrl, SUPPORTED_LOCALES } from '@/lib/metadata';

const PUBLIC_ROUTES = [
  { path: '/demo', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/pricing', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.4 },
];

const ROUTE_TO_SOURCE_FILE: Record<string, string> = {
  '/demo': 'src/app/[locale]/demo/page.tsx',
  '/pricing': 'src/app/[locale]/pricing/page.tsx',
  '/contact': 'src/app/[locale]/contact/page.tsx',
  '/faq': 'src/app/[locale]/faq/page.tsx',
  '/privacy': 'src/app/[locale]/privacy/page.tsx',
};

async function resolveLastModified(routePath: string): Promise<Date> {
  const sourceFile = ROUTE_TO_SOURCE_FILE[routePath];

  if (!sourceFile) {
    return new Date();
  }

  try {
    const sourcePath = path.join(process.cwd(), sourceFile);
    const fileStats = await stat(sourcePath);
    return fileStats.mtime;
  } catch {
    return new Date();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const routeDates = await Promise.all(
    PUBLIC_ROUTES.map(async route => ({
      ...route,
      lastModified: await resolveLastModified(route.path),
    }))
  );

  return SUPPORTED_LOCALES.flatMap(locale =>
    routeDates.map(route => ({
      url: `${baseUrl}/${locale}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))
  );
}