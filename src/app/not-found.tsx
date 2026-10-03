// Root App Router 404. Providing this makes Next generate /404 through the App
// Router (which already has a valid root <html> layout) instead of falling back
// to the Pages-Router /_error, which conflicts with the App Router global-error
// under Next 15 ("<Html> should not be imported outside pages/_document").
export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '1rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Page introuvable
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          La page que vous recherchez n&apos;existe pas.
        </p>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
