'use client';

import { useEffect } from 'react';

// IMPORTANT: do NOT statically import Sentry here — report lazily at runtime so
// nothing Sentry-related runs during the `/_global-error` prerender.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    let cancelled = false;
    import('@sentry/nextjs')
      .then((Sentry) => {
        if (!cancelled) Sentry.captureException(error);
      })
      .catch(() => {
        /* Sentry unavailable — swallow, the UI below still renders. */
      });
    return () => {
      cancelled = true;
    };
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Une erreur inattendue s&apos;est produite. Veuillez réessayer.
          </p>
          {error?.digest && (
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>
              ID: {error.digest}
            </p>
          )}
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </body>
    </html>
  );
}
