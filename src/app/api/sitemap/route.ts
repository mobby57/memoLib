import { NextResponse } from 'next/server';
import { getBaseUrl, SUPPORTED_LOCALES } from '@/lib/metadata';

const PUBLIC_ROUTES = [
  { path: '', changeFrequency: 'weekly', priority: 1 },
  { path: '/logiciel-avocat', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/gestion-cabinet-avocat', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/oqtf-delais-recours', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/demo', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/pricing', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.4 },
];

export async function GET() {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString().split('T')[0];

  const urls = SUPPORTED_LOCALES.flatMap(locale =>
    PUBLIC_ROUTES.map(route => `
    <url>
      <loc>${baseUrl}/${locale}${route.path}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>${route.changeFrequency}</changefreq>
      <priority>${route.priority}</priority>
    </url>`)
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
