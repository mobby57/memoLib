// Robots.txt configuration
// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://memolib.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/super-admin/',
          '/dev/',
          '/test/',
          '/test-login/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin/', '/super-admin/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
