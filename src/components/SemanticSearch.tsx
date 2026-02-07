/**
 * Composant de Recherche Semantique
 * Interface de recherche intelligente avec IA
 * 
 * Innovation: Recherche par sens, pas juste mots-cles
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface SearchResult {
  id: string;
  numero: string;
  type: string;
  description: string;
  similarity: number;
  client: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: string;
  statut: string;
}

interface PatternAnalysis {
  commonDocuments: string[];
  averageDuration: number;
  successRate: number;
  recommendations: string[];
}

export function SemanticSearch({ tenantId }: { tenantId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setPatterns(null);

    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/semantic-search?q=${encodeURIComponent(query)}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      logger.error('Erreur recherche semantique', { error, query, tenantId });
    } finally {
      setLoading(false);
    }
  };

  const analyzePatterns = async () => {
    if (!query.trim()) return;

    setAnalyzing(true);

    try {
      const response = await fetch(
        `/api/tenant/${tenantId}/semantic-search/patterns?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        setPatterns(data);
      }
    } catch (error) {
      logger.error('Erreur analyse patterns semantiques', { error, query, tenantId });
    } finally {
      setAnalyzing(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(`/api/tenant/${tenantId}/semantic-search/suggestions`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedQueries(data.suggestions || []);
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    }
  };

  React.useEffect(() => {
    loadSuggestions();
  }, [tenantId]);

  return (
    <div className="space-y-6">
      {/* Zone de recherche */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-4"> Recherche Semantique IA</h2>
        <p className="text-blue-100 mb-4">
          Recherchez par sens, pas par mots-cles. L'IA comprend votre intention.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: dossiers de regularisation avec employeur..."
            className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '' : ''} Rechercher
          </button>
          {results.length > 0 && (
            <button
              onClick={analyzePatterns}
              disabled={analyzing}
              className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 transition disabled:opacity-50"
            >
              {analyzing ? '' : ''} Analyser
            </button>
          )}
        </div>

        {/* Suggestions de recherche */}
        {suggestedQueries.length > 0 && results.length === 0 && (
          <div className="mt-4">
            <div className="text-sm text-blue-200 mb-2">Suggestions populaires:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(suggestion);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-sm transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analyse de patterns */}
      {patterns && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
             Analyse des Patterns Detectes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Documents Communs</div>
              <div className="text-2xl font-bold text-purple-600">
                {patterns.commonDocuments.length}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Duree Moyenne</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(patterns.averageDuration)} jours
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Taux de Succes</div>
              <div className="text-2xl font-bold text-green-600">
                {(patterns.successRate * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {patterns.commonDocuments.length > 0 && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="font-semibold text-gray-900 mb-2">
                 Documents frequemment requis:
              </div>
              <div className="flex flex-wrap gap-2">
                {patterns.commonDocuments.map((doc, index) => (
                  <span
                    key={index}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {patterns.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="font-semibold text-gray-900"> Recommandations:</div>
              {patterns.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 mt-0.5">-</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resultats de recherche */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              {results.length} Dossier{results.length > 1 ? 's' : ''} Trouve{results.length > 1 ? 's' : ''}
            </h3>
            <span className="text-sm text-gray-600">Tries par pertinence</span>
          </div>

          {results.map((result) => {
            const similarityPercent = result.similarity * 100;
            let similarityColor = 'bg-green-500';
            if (similarityPercent < 70) similarityColor = 'bg-yellow-500';
            if (similarityPercent < 50) similarityColor = 'bg-orange-500';

            return (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-gray-600">
                        {result.numero}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {result.type}
                      </span>
                      <span
                        className={`${
                          result.statut === 'CLOTURE'
                            ? 'bg-green-100 text-green-800'
                            : result.statut === 'EN_COURS'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        } px-2 py-1 rounded text-xs font-medium`}
                      >
                        {result.statut}
                      </span>
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-1">
                      {result.client.prenom} {result.client.nom}
                    </h4>

                    {result.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {result.description}
                      </p>
                    )}

                    <div className="text-xs text-gray-500">
                      Cree le {format(new Date(result.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </div>
                  </div>

                  {/* Score de similarite */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">Pertinence</div>
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          className={similarityColor}
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${similarityPercent * 1.76} 176`}
                          style={{ stroke: 'currentColor' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">
                          {similarityPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* etat vide */}
      {!loading && results.length === 0 && query && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-4xl mb-2"></div>
          <div className="font-medium text-gray-900 mb-1">Aucun resultat trouve</div>
          <div className="text-sm text-gray-600">
            Essayez une recherche differente ou plus generale
          </div>
        </div>
      )}
    </div>
  );
}
