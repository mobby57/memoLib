'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function LawyerAdvancedPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <span>[emoji]</span>
              Fonctionnalites IA Avancees
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Outils d'analyse et d'automatisation pour votre cabinet
            </p>
          </div>
          <Link
            href="/lawyer/integrations"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
          >
            Voir la demo complete [Next]
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* AI Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-violet-200 dark:border-violet-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-2xl">
                [emoji]
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Analyse IA CESEDA
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Analyse automatique des dossiers avec Ollama
                </p>
                <button
                  onClick={() => {
                    window.open('/api/test/ceseda-analysis', '_blank');
                  }}
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  Tester l'API [Next]
                </button>
              </div>
            </div>
          </div>

          {/* WebSocket */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl">
                [emoji]
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Notifications Temps Reel
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  WebSocket pour mises a jour instantanees
                </p>
                <Link
                  href="/lawyer/integrations"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Voir la demo [Next]
                </Link>
              </div>
            </div>
          </div>

          {/* RGPD */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-emerald-200 dark:border-emerald-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-2xl">
                [emoji]
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Conformite RGPD
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Outils d'anonymisation et export de donnees
                </p>
                <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                  En savoir plus [Next]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            etat de l'integration
          </h2>
          <div className="space-y-3">
            <StatusItem
              label="Client Ollama IA"
              file="src/lib/ai/ceseda-analyzer.ts"
              status="ready"
            />
            <StatusItem
              label="Middleware Tenant Isolation"
              file="src/middleware/tenant-isolation.ts"
              status="ready"
            />
            <StatusItem
              label="Helpers RGPD"
              file="src/lib/utils/rgpd-helpers.ts"
              status="ready"
            />
            <StatusItem
              label="API Test CESEDA"
              file="src/app/api/test/ceseda-analysis/route.ts"
              status="ready"
            />
            <StatusItem
              label="Composant WebSocket"
              file="src/components/examples/WebSocketNotificationDemo.tsx"
              status="ready"
            />
          </div>
        </div>

        {/* Quick Commands */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Commandes de test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CommandCard
              title="Verifier Ollama"
              command="curl http://localhost:11434"
              description="Confirmer que Ollama est demarre"
            />
            <CommandCard
              title="Demarrer le serveur"
              command="npm run dev"
              description="Lancer l'application en mode developpement"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  file,
  status,
}: {
  label: string;
  file: string;
  status: 'ready' | 'pending' | 'error';
}) {
  const colors = {
    ready: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    error: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };

  const icons = {
    ready: '[Check]',
    pending: '',
    error: '[X]',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700">
      <div className="flex-1">
        <div className="font-medium text-slate-900 dark:text-white">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{file}</div>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
        {icons[status]} {status === 'ready' ? 'Pret' : status === 'pending' ? 'En attente' : 'Erreur'}
      </div>
    </div>
  );
}

function CommandCard({
  title,
  command,
  description,
}: {
  title: string;
  command: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-lg p-4">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-white/80 mb-2">{description}</p>
      <code className="block text-xs bg-black/20 px-3 py-2 rounded font-mono">{command}</code>
    </div>
  );
}
