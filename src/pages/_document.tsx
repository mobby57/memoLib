/**
 * Custom Document for Pages Router
 * Required to properly handle Html imports for NextAuth pages
 */
import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
