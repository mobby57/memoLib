import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

const locales = ['en', 'fr', 'es', 'de', 'pt', 'ja', 'zh', 'hi', 'ru', 'ko'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Determine text direction based on locale
  const rtlLocales = ['ar', 'he', 'ur', 'fa'];
  const isRTL = rtlLocales.includes(locale);

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>MemoLib - Global Platform</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
