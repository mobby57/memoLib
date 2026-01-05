/**
 * Page de démonstration du système de validation IA
 * Permet de tester manuellement les différentes actions IA
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DemoPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const tenantId = session?.user?.tenantId || 'cabinet-dupont';

  // Test 1: Créer une action de triage d'email
  const testTriageEmail = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/ai-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'EMAIL_TRIAGE',
          autonomyLevel: 'GREEN',
          input: {
            emailContent: 'Bonjour, je souhaite régulariser ma situation...',
            emailSubject: 'Demande de régularisation'
          },
          confidence: 0.92,
          rationale: 'Email clair demandant une régularisation administrative'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Créer une action de génération de brouillon (nécessite validation)
  const testGenerateDraft = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/ai-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'GENERATE_DRAFT',
          autonomyLevel: 'ORANGE',
          input: {
            templateId: 'TEMPLATE_DOCUMENT_REQUEST',
            variables: {
              clientName: 'Test Client',
              documents: 'passeport, titre de séjour'
            }
          },
          output: {
            draftId: 'DRAFT-TEST-001',
            content: 'Bonjour M. Test Client,\n\nNous avons besoin des documents suivants...'
          },
          confidence: 0.85,
          rationale: 'Brouillon généré à partir du template pré-validé'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Lister les actions en attente
  const testListPendingActions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/ai-actions?status=PENDING`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Créer une alerte
  const testCreateAlert = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/tenant/${tenantId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEADLINE',
          severity: 'ALERT',
          message: 'Le dossier DOSS-2026-001 arrive à échéance dans 3 jours',
          dossierId: 'test-dossier-001',
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          suggestedActions: [
            'Contacter le client',
            'Préparer les documents manquants',
            'Planifier un RDV préfecture'
          ]
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Démo - Système de Validation IA
          </h1>
          <p className="text-gray-600">
            Testez les différentes actions IA et le système de validation
          </p>
          {session && (
            <p className="text-sm text-gray-500 mt-2">
              Tenant: {tenantId} • Utilisateur: {session.user.name}
            </p>
          )}
        </div>

        {/* Tests disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🟢</span>
              <div>
                <h3 className="font-bold text-gray-900">Triage d'Email</h3>
                <p className="text-sm text-gray-600">Action GREEN - Auto-approuvée</p>
              </div>
            </div>
            <button
              onClick={testTriageEmail}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Tester Triage Email
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🟠</span>
              <div>
                <h3 className="font-bold text-gray-900">Génération Brouillon</h3>
                <p className="text-sm text-gray-600">Action ORANGE - Validation requise</p>
              </div>
            </div>
            <button
              onClick={testGenerateDraft}
              disabled={loading}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              Tester Génération Brouillon
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📋</span>
              <div>
                <h3 className="font-bold text-gray-900">Actions en Attente</h3>
                <p className="text-sm text-gray-600">Lister les validations</p>
              </div>
            </div>
            <button
              onClick={testListPendingActions}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Lister Actions Pendantes
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🚨</span>
              <div>
                <h3 className="font-bold text-gray-900">Créer Alerte</h3>
                <p className="text-sm text-gray-600">Test du système d'alertes</p>
              </div>
            </div>
            <button
              onClick={testCreateAlert}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Créer Alerte Test
            </button>
          </div>
        </div>

        {/* Résultats */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800">Traitement en cours...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="font-bold text-red-900 mb-2">❌ Erreur</h3>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-bold text-gray-900 mb-4">✅ Résultat</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Liens utiles */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mt-8">
          <h3 className="font-bold text-xl mb-4">🔗 Liens Utiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/dashboard"
              className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition"
            >
              <div className="font-semibold mb-1">📊 Dashboard</div>
              <div className="text-sm text-blue-100">Vue d'ensemble</div>
            </a>
            <a
              href="/docs/CHARTE_IA_JURIDIQUE.md"
              target="_blank"
              className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition"
            >
              <div className="font-semibold mb-1">📖 Charte IA</div>
              <div className="text-sm text-blue-100">Règles et protocoles</div>
            </a>
            <a
              href="http://localhost:11434"
              target="_blank"
              className="bg-white bg-opacity-20 rounded-lg p-4 hover:bg-opacity-30 transition"
            >
              <div className="font-semibold mb-1">🤖 Ollama</div>
              <div className="text-sm text-blue-100">Serveur IA local</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
