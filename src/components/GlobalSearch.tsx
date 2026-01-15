'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Users, FolderOpen, Mail, Filter, Clock, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'dossier' | 'client' | 'document' | 'email';
  title: string;
  description: string;
  relevanceScore: number;
  metadata: Record<string, any>;
  highlights: string[];
  url: string;
  createdAt: string;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  suggestions: string[];
  facets: {
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byDate: Record<string, number>;
  };
  executionTime: number;
}

const typeIcons = {
  dossier: FolderOpen,
  client: Users,
  document: FileText,
  email: Mail,
};

const typeColors = {
  dossier: 'text-blue-600 bg-blue-50',
  client: 'text-green-600 bg-green-50',
  document: 'text-purple-600 bg-purple-50',
  email: 'text-orange-600 bg-orange-50',
};

const typeLabels = {
  dossier: 'Dossier',
  client: 'Client',
  document: 'Document',
  email: 'Email',
};

export default function GlobalSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, selectedFilter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        type: selectedFilter,
        limit: '20',
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Erreur de recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (url: string) => {
    window.location.href = url;
    if (onClose) onClose();
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    inputRef.current?.focus();
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    
    const highlight = highlights[0];
    const index = text.toLowerCase().indexOf(highlight.toLowerCase());
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <mark className="bg-yellow-200 px-1 rounded">{text.substring(index, index + highlight.length)}</mark>
        {text.substring(index + highlight.length)}
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dossiers, clients, documents, emails..."
              className="flex-1 outline-none text-lg"
            />
            {query && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded ${showFilters ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {['all', 'dossiers', 'clients', 'documents', 'emails'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all' ? 'Tout' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && results && (
            <>
              {/* Stats */}
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {results.totalCount} résultat{results.totalCount > 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {results.executionTime}ms
                  </span>
                </div>
                {results.suggestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Suggestions:</span>
                    {results.suggestions.slice(0, 3).map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(suggestion)}
                        className="px-2 py-1 bg-white rounded border border-gray-200 hover:border-blue-300 text-xs"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Results List */}
              <div className="divide-y">
                {results.results.map((result) => {
                  const Icon = typeIcons[result.type];
                  const colorClass = typeColors[result.type];
                  const typeLabel = typeLabels[result.type];

                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.url)}
                      className="w-full p-4 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {highlightText(result.title, result.highlights)}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {result.description}
                          </p>
                          {result.highlights.length > 0 && (
                            <p className="text-sm text-gray-500 mt-1 italic line-clamp-1">
                              {result.highlights[0]}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span>{new Date(result.createdAt).toLocaleDateString('fr-FR')}</span>
                            {result.metadata.statut && (
                              <span className="capitalize">{result.metadata.statut}</span>
                            )}
                            {result.metadata.clientName && (
                              <span>{result.metadata.clientName}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Score: {Math.round(result.relevanceScore)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!loading && results && results.results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="w-12 h-12 mb-3 text-gray-300" />
              <p className="text-lg font-medium">Aucun résultat trouvé</p>
              <p className="text-sm">Essayez avec d'autres termes</p>
            </div>
          )}

          {!loading && !results && query.length > 0 && query.length < 2 && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <p>Entrez au moins 2 caractères pour rechercher</p>
            </div>
          )}

          {!loading && !results && !query && (
            <div className="p-8 text-center text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Recherche rapide</p>
              <p className="text-sm">
                Recherchez dans tous vos dossiers, clients, documents et emails
              </p>
              <div className="mt-6 text-xs text-left max-w-md mx-auto space-y-2">
                <p><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 rounded">K</kbd> pour ouvrir</p>
                <p><kbd className="px-2 py-1 bg-gray-100 rounded">ESC</kbd> pour fermer</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec facettes */}
        {results && results.results.length > 0 && (
          <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium">Par type:</span>
                {Object.entries(results.facets.byType).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 bg-white rounded border">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
