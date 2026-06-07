// Script exécuté avant/après le build pour générer sitemap.xml et robots.txt statiques
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memolib.space';
const LOCALES = ['fr', 'en'];

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

const now = new Date().toISOString().split('T')[0];

// Génère les URLs avec hreflang alternates
const urls = PUBLIC_ROUTES.flatMap(route =>
  LOCALES.map(locale => {
    const alternates = LOCALES.map(
      alt => `      <xhtml:link rel="alternate" hreflang="${alt}" href="${BASE_URL}/${alt}${route.path}" />`
    ).join('\n');

    return `  <url>
    <loc>${BASE_URL}/${locale}${route.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
${alternates}
  </url>`;
  })
).join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

const PRIVATE_SECTIONS = ['/api/', '/admin/', '/super-admin/', '/dashboard/', '/workspaces/', '/dossiers/', '/documents/', '/factures/', '/clients/', '/settings/', '/auth/', '/login', '/dev/', '/test/', '/_next/', '/static/'];
const localizedPrivate = LOCALES.flatMap(l => PRIVATE_SECTIONS.map(p => `Disallow: /${l}${p}`));

const robots = `User-agent: *
Allow: /
${PRIVATE_SECTIONS.map(p => `Disallow: ${p}`).join('\n')}
${localizedPrivate.join('\n')}

Sitemap: ${BASE_URL}/sitemap.xml
`;

const publicDir = path.join(__dirname, 'public');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);
console.log('✅ Generated sitemap.xml and robots.txt');
