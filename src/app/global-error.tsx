'use client';

// Global error boundary (Next 16). Volontairement MINIMAL : aucun hook, aucun
// effet, aucun import tiers au niveau module — pour que le prerender de la route
// synthetique /_global-error ne tente pas d'evaluer un contexte runtime absent
// ("Cannot read properties of null (reading 'useContext')").
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: '1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
