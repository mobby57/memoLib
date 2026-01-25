export default function Custom404() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: '1rem'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          404
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: '#4b5563',
          marginBottom: '2rem'
        }}>
          Page non trouvée
        </p>
        <a
          href="/dashboard"
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500
          }}
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}
