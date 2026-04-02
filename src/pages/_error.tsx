/**
 * Custom Error Page for Pages Router
 * Required to prevent NextAuth's default pages from using Html import
 */

import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode: number;
}

function Error({ statusCode }: ErrorProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{ fontSize: '4rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}
        >
          {statusCode || 'Erreur'}
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2rem' }}>
          {statusCode === 404 ? 'Page non trouvée' : 'Une erreur est survenue'}
        </p>
        <a
          href="/dashboard"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
