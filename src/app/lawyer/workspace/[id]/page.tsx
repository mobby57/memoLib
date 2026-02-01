'use client';

// Force dynamic to prevent prerendering errors with React hooks
export const dynamic = 'force-dynamic';

/**
 * 🧠 Workspace Viewer - Interface Complète du Raisonnement
 *
 * 1 ÉCRAN = 1 ÉTAT
 * Timeline visuelle + Panels contextuels + Actions intelligentes
 * Avec SWR pour auto-refresh temps réel
 */

import { WorkspaceTimeline } from '@/components/workspace/WorkspaceTimeline';
import { ActionsPanel } from '@/components/workspace/panels/ActionsPanel';
import { ContextPanel } from '@/components/workspace/panels/ContextPanel';
import { FactsPanel } from '@/components/workspace/panels/FactsPanel';
import { MissingPanel } from '@/components/workspace/panels/MissingPanel';
import { ObligationsPanel } from '@/components/workspace/panels/ObligationsPanel';
import { ReadyPanel } from '@/components/workspace/panels/ReadyPanel';
import { RisksPanel } from '@/components/workspace/panels/RisksPanel';
import {
  WorkspaceReasoning,
  WorkspaceState,
  formatUncertaintyLevel,
} from '@/types/workspace-reasoning';
import { ArrowLeft, Lock, Sparkles, Unlock } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const [selectedState, setSelectedState] = useState<WorkspaceState | null>(null);

  // SWR avec auto-refresh toutes les 5 secondes
  const { data, error, isLoading, mutate } = useSWR(
    workspaceId ? `/api/lawyer/workspace/${workspaceId}` : null,
    fetcher,
    {
      refreshInterval: 5000, // 5 secondes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Extraire les données de SWR
  const workspace = data?.workspace as WorkspaceReasoning | null;
  const facts = workspace?.facts || [];
  const contexts = workspace?.contexts || [];
  const obligations = workspace?.obligations || [];
  const missingElements = workspace?.missingElements || [];
  const risks = workspace?.risks || [];
  const actions = workspace?.proposedActions || [];
  const traces = workspace?.reasoningTraces || [];
  // Handlers d'actions
  async function handleResolve(missingElementId: string, resolution: string) {
    try {
      const response = await fetch(`/api/lawyer/workspace/${workspaceId}/resolve-missing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missingElementId, resolution }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de résolution');
      }

      // Revalider les données pour obtenir la version mise à jour
      mutate();
    } catch (error) {
      console.error('Erreur résolution:', error);
      alert(error instanceof Error ? error.message : 'Erreur de résolution');
    }
  }

  async function handleExecute(actionId: string, result?: string) {
    try {
      const response = await fetch(`/api/lawyer/workspace/${workspaceId}/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, result }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur d'exécution");
      }

      // Revalider les données
      mutate();
    } catch (error) {
      console.error('Erreur exécution:', error);
      alert(error instanceof Error ? error.message : "Erreur d'exécution");
    }
  }

  async function handleLock() {
    if (!confirm('Verrouiller ce workspace ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/lawyer/workspace/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur de verrouillage');
      }

      mutate();
    } catch (error) {
      console.error('Erreur verrouillage:', error);
      alert(error instanceof Error ? error.message : 'Erreur de verrouillage');
    }
  }

  async function handleExport(format: 'json' | 'markdown' = 'markdown') {
    try {
      const response = await fetch(`/api/lawyer/workspace/${workspaceId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error("Erreur d'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workspace-${workspaceId}.${format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur export:', error);
      alert("Erreur d'export");
    }
  }

  // Handler: Exécuter raisonnement IA
  const [isExecutingAI, setIsExecutingAI] = React.useState(false);

  async function handleExecuteAI() {
    if (!workspace) return;

    setIsExecutingAI(true);

    try {
      const response = await fetch(`/api/lawyer/workspace/${workspaceId}/execute-reasoning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'next' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec du raisonnement');
      }

      const data = await response.json();

      // Revalidate SWR
      mutate();

      // Feedback utilisateur
      alert(
        `✅ Raisonnement IA exécuté!\n\nNouvel état: ${data.result.newState}\nIncertitude: ${(data.result.uncertaintyLevel * 100).toFixed(0)}%`
      );
    } catch (error) {
      console.error('Erreur IA:', error);
      alert(`❌ ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsExecutingAI(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🧠</div>
          <p className="text-gray-600">Chargement du raisonnement...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error ? 'Erreur de chargement' : 'Workspace introuvable'}
          </h1>
          <button
            onClick={() => router.push('/lawyer/workspaces')}
            className="text-blue-600 hover:underline"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  const uncertaintyInfo = formatUncertaintyLevel(workspace.uncertaintyLevel);
  const completedStates = getCompletedStates(workspace.currentState);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/lawyer/workspaces')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">🧠</span>
                  Workspace #{workspace.id.slice(0, 8)}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Source : {workspace.sourceType} • Créé le{' '}
                  {new Date(workspace.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Niveau d'incertitude */}
              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <div className="text-xs text-gray-600 mb-1">Incertitude</div>
                <div className={`text-sm font-bold ${uncertaintyInfo.color}`}>
                  {uncertaintyInfo.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(workspace.uncertaintyLevel * 100)}%
                </div>
              </div>

              {/* Verrouillage */}
              <div
                className={`
                  px-4 py-2 rounded-lg flex items-center gap-2
                  ${workspace.locked ? 'bg-green-100' : 'bg-orange-100'}
                `}
              >
                {workspace.locked ? (
                  <>
                    <Lock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Verrouillé</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">En cours</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <WorkspaceTimeline
            currentState={workspace.currentState}
            completedStates={completedStates}
            onClick={state => setSelectedState(state)}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="col-span-2 space-y-6">
            {/* Panel contextuel selon l'état sélectionné */}
            {renderStatePanel()}

            {/* Traces de raisonnement */}
            {traces.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Traces de Raisonnement ({traces.length})
                </h3>

                <div className="space-y-3">
                  {traces.map(trace => (
                    <div
                      key={trace.id}
                      className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-purple-900">{trace.step}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(trace.createdAt).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{trace.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Message source */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Message Source</h3>
              <div className="bg-gray-50 rounded p-4 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{workspace.sourceRaw}</p>
              </div>
            </div>

            {/* Stats rapides */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Statistiques</h3>

              <div className="space-y-3">
                <StatItem label="Faits extraits" value={facts.length} icon="✓" />
                <StatItem label="Contextes" value={contexts.length} icon="🧭" />
                <StatItem label="Obligations" value={obligations.length} icon="📜" />
                <StatItem
                  label="Manques"
                  value={missingElements.filter(m => !m.resolved).length}
                  icon="❗"
                  highlight={missingElements.some(m => m.blocking && !m.resolved)}
                />
                <StatItem label="Risques" value={risks.length} icon="⚠️" />
                <StatItem label="Actions" value={actions.length} icon="👉" />
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions Rapides</h3>

              <div className="space-y-2">
                {/* Bouton IA - Visible seulement si pas au dernier état et pas verrouillé */}
                {workspace.currentState !== 'READY_FOR_HUMAN' && !workspace.locked && (
                  <button
                    onClick={handleExecuteAI}
                    disabled={isExecutingAI}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isExecutingAI ? (
                      <>
                        <div className="animate-spin">⚙️</div>
                        <span>IA en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>🧠</span>
                        <span>Exécuter Raisonnement IA</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Exporter (Markdown)
                </button>

                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Exporter (JSON)
                </button>

                {!workspace.locked && (
                  <button
                    onClick={handleLock}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Verrouiller et finaliser
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function renderStatePanel() {
    const state = selectedState || workspace!.currentState;

    switch (state) {
      case 'RECEIVED':
        return <ReceivedPanel workspace={workspace!} />;

      case 'FACTS_EXTRACTED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <FactsPanel facts={facts} />
          </div>
        );

      case 'CONTEXT_IDENTIFIED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ContextPanel contexts={contexts} />
          </div>
        );

      case 'OBLIGATIONS_DEDUCED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ObligationsPanel obligations={obligations} contexts={contexts} />
          </div>
        );

      case 'MISSING_IDENTIFIED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <MissingPanel missingElements={missingElements} onResolve={handleResolve} />
          </div>
        );

      case 'RISK_EVALUATED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <RisksPanel risks={risks} />
          </div>
        );

      case 'ACTION_PROPOSED':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ActionsPanel actions={actions} onExecute={handleExecute} />
          </div>
        );

      case 'READY_FOR_HUMAN':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ReadyPanel
              workspace={workspace!}
              summary={{
                factsCount: facts.length,
                contextsCount: contexts.length,
                obligationsCount: obligations.length,
                missingResolved: missingElements.filter(m => m.resolved).length,
                risksEvaluated: risks.length,
                actionsProposed: actions.length,
              }}
              onLock={handleLock}
              onExport={handleExport}
            />
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Panel en construction</h3>
              <p className="text-gray-600">
                L'interface pour l'état "{state}" sera bientôt disponible.
              </p>
            </div>
          </div>
        );
    }
  }
}

function ReceivedPanel({ workspace }: { workspace: WorkspaceReasoning }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📥</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Signal Brut Reçu</h3>
        <p className="text-gray-600 mb-6">
          Le workspace vient d'être créé. L'analyse n'a pas encore commencé.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
          <p className="text-sm text-blue-800">
            <strong>Prochaine étape :</strong> Extraction des faits certains du message source.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span
        className={`
          text-sm font-bold
          ${highlight ? 'text-red-600' : 'text-gray-900'}
        `}
      >
        {value}
      </span>
    </div>
  );
}

function getCompletedStates(currentState: WorkspaceState): WorkspaceState[] {
  const stateOrder: WorkspaceState[] = [
    'RECEIVED',
    'FACTS_EXTRACTED',
    'CONTEXT_IDENTIFIED',
    'OBLIGATIONS_DEDUCED',
    'MISSING_IDENTIFIED',
    'RISK_EVALUATED',
    'ACTION_PROPOSED',
    'READY_FOR_HUMAN',
  ];

  const currentIndex = stateOrder.indexOf(currentState);
  return stateOrder.slice(0, currentIndex);
}
