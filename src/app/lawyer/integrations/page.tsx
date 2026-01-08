import Link from 'next/link';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Fonctionnalités Intégrées
          </h1>
          <p className="text-gray-600">
            Explorez les nouvelles fonctionnalités IA et temps réel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-violet-500">
            <h2 className="text-xl font-semibold mb-3">Analyse IA CESEDA</h2>
            <p className="text-gray-600 mb-4">
              Analyse automatique des dossiers avec Ollama
            </p>
            <Link
              href="/api/test/ceseda-analysis"
              className="inline-block px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700"
            >
              Tester
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-semibold mb-3">WebSocket</h2>
            <p className="text-gray-600">
              Notifications temps réel
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
            <h2 className="text-xl font-semibold mb-3">RGPD</h2>
            <p className="text-gray-600">
              Conformité RGPD
            </p>
          </div>

        </div>

        <div className="mt-8 flex gap-4">
          <Link
            href="/lawyer/advanced"
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Dashboard Avocat
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Dashboard Principal
          </Link>
        </div>

      </div>
    </div>
  );
}
