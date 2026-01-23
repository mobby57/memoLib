/**
 * Page de démonstration des fonctionnalités avancées
 * Recherche sémantique, Suggestions, Analytics
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { SmartSuggestions } from '@/components/SmartSuggestions';
import { SemanticSearch } from '@/components/SemanticSearch';

export default function AdvancedFeaturesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'analytics' | 'suggestions' | 'search'>('analytics');

  const tenantId = session?.user?.tenantId || 'cabinet-dupont';

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="font-semibold text-gray-900">Connexion requise</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                🚀 Fonctionnalités Avancées IA
              </h1>
              <p className="text-blue-100 mt-1">
                Apprentissage continu, Suggestions intelligentes, Recherche sémantique
              </p>
            </div>
            <a
              href="/dashboard"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              ← Retour Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation par onglets */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Analytics & Apprentissage
            </button>
            
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'suggestions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💡 Suggestions Intelligentes
            </button>
            
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Recherche Sémantique
            </button>
          </nav>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                🧠 Apprentissage Continu
              </h2>
              <p className="text-gray-700">
                Le système analyse chaque validation humaine pour améliorer ses prédictions.
                Plus vous validez, plus l'IA devient précise et adaptée à votre cabinet.
              </p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600">Ajustement automatique</div>
                  <div className="text-lg font-bold text-green-600">+5% confiance</div>
                  <div className="text-xs text-gray-500">Actions &gt; 90% succès</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600">Détection de baisse</div>
                  <div className="text-lg font-bold text-orange-600">-10% confiance</div>
                  <div className="text-xs text-gray-500">Actions &lt; 70% succès</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600">Prédiction d'approbation</div>
                  <div className="text-lg font-bold text-blue-600">ML-powered</div>
                  <div className="text-xs text-gray-500">Basé sur historique</div>
                </div>
              </div>
            </div>

            <AnalyticsDashboard tenantId={tenantId} />
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                💡 IA Proactive
              </h2>
              <p className="text-gray-700 mb-4">
                L'IA analyse en permanence vos dossiers pour identifier les opportunités
                d'amélioration et vous suggérer des actions pertinentes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">📁</div>
                  <div className="text-xs font-medium">Dossiers inactifs</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">📄</div>
                  <div className="text-xs font-medium">Documents manquants</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">⏰</div>
                  <div className="text-xs font-medium">Échéances proches</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl mb-1">🤖</div>
                  <div className="text-xs font-medium">Auto-optimisation</div>
                </div>
              </div>
            </div>

            <SmartSuggestions tenantId={tenantId} />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                🔍 Recherche par Sens, pas par Mots-Clés
              </h2>
              <p className="text-gray-700 mb-4">
                Utilisez le pouvoir des embeddings IA pour trouver des dossiers similaires
                même s'ils n'ont pas les mêmes mots-clés. L'IA comprend le contexte.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    Compréhension sémantique
                  </div>
                  <div className="text-sm text-gray-600">
                    Recherche par intention, pas par mots exacts
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    Analyse de patterns
                  </div>
                  <div className="text-sm text-gray-600">
                    Documents communs, durées, taux de succès
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-semibold text-gray-900 mb-1">
                    Suggestions intelligentes
                  </div>
                  <div className="text-sm text-gray-600">
                    Requêtes populaires basées sur vos données
                  </div>
                </div>
              </div>
            </div>

            <SemanticSearch tenantId={tenantId} />
          </div>
        )}
      </main>
    </div>
  );
}
