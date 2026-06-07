import { NextResponse } from 'next/server';
import { getBaseUrl, SUPPORTED_LOCALES } from '@/lib/metadata';

const PRIVATE_SECTIONS = [
  '/api/', '/admin/', '/super-admin/', '/dashboard/',
  '/workspaces/', '/dossiers/', '/documents/', '/factures/',
  '/clients/', '/settings/', '/auth/', '/login',
  '/dev/', '/test/', '/test-login/', '/_next/', '/static/',
];

export async function GET() {
  const baseUrl = getBaseUrl();
  const localizedPrivate = SUPPORTED_LOCALES.flatMap(locale =>
    PRIVATE_SECTIONS.map(path => `Disallow: /${locale}${path}`)
  );

  const txt = `User-agent: *
Allow: /
${PRIVATE_SECTIONS.map(p => `Disallow: ${p}`).join('\n')}
${localizedPrivate.join('\n')}

User-agent: Googlebot
Allow: /
${PRIVATE_SECTIONS.map(p => `Disallow: ${p}`).join('\n')}
${localizedPrivate.join('\n')}

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new NextResponse(txt, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
