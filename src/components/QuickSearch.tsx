'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, Clock, Star } from 'lucide-react';

interface QuickSearchProps {
  className?: string;
}

export default function QuickSearch({ className = '' }: QuickSearchProps) {
  const [query, setQuery] = useState('');
  const [quickResults, setQuickResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const recentSearches = [
    'Dossier CESEDA',
    'Client Martin',
    'Documents urgents',
  ];

  const popularSearches = [
    'Dossiers en cours',
    'Emails non lus',
    'Documents récents',
    'Clients actifs',
  ];

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();
      setQuickResults(data.results || []);
    } catch (error) {
      console.error('Quick search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recherche rapide
        </h3>
        <Link
          href="/search"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Recherche avancée →
        </Link>
      </div>

      {/* Formulaire de recherche */}
      <form onSubmit={handleQuickSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </form>

      {/* Résultats rapides */}
      {quickResults.length > 0 && (
        <div className="mb-4 space-y-2">
          {quickResults.map((result) => (
            <Link
              key={result.id}
              href={result.url || '#'}
              className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {result.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {result.title}
                  </p>
                  {result.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {result.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Recherches récentes */}
      {recentSearches.length > 0 && query.length === 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recherches récentes
            </h4>
          </div>
          <div className="space-y-1">
            {recentSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(search)}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 
                         hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recherches populaires */}
      {popularSearches.length > 0 && query.length === 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Recherches populaires
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(search)}
                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                         rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Raccourci clavier */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Appuyez sur{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono">
            Ctrl+K
          </kbd>{' '}
          pour la recherche globale
        </p>
      </div>
    </div>
  );
}
