import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'fr', 'es', 'de', 'pt', 'ja', 'zh', 'hi', 'ru', 'ko'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|public|static).*)'],
};
