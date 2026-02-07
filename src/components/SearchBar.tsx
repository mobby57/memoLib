'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, FileText, Users, Folder, Mail, Loader2, TrendingUp } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'client' | 'dossier' | 'document' | 'email';
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  url?: string;
  date?: string;
  tags?: string[];
}

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export default function SearchBar({
  placeholder = 'Rechercher des clients, dossiers, documents...',
  className = '',
  showFilters = true,
  onResultClick,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fermer les resultats en cliquant a l'exterieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Raccourci clavier Ctrl+K ou Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
      await fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedTypes]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (selectedTypes.length > 0) {
        params.append('types', selectedTypes.join(','));
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      setResults(data.results || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    
    if (onResultClick) {
      onResultClick(result);
    } else if (result.url) {
      router.push(result.url);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="w-4 h-4" />;
      case 'dossier':
        return <Folder className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'dossier':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'document':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'email':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      {/* Barre de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Raccourci clavier */}
        {!query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
              Ctrl+K
            </kbd>
          </div>
        )}
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="flex gap-2 mt-2">
          {['client', 'dossier', 'document', 'email'].map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${
                  selectedTypes.includes(type)
                    ? getTypeColor(type)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
            >
              <span className="flex items-center gap-1">
                {getIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Resultats et suggestions */}
      {showResults && (query.length >= 2) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {/* Suggestions */}
          {suggestions.length > 0 && results.length === 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>Suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultats */}
          {results.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.title}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(result.type)}`}>
                          {result.type}
                        </span>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {result.subtitle}
                        </p>
                      )}
                      {result.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {result.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aucun resultat trouve</p>
                <p className="text-xs mt-1">Essayez avec d'autres mots-cles</p>
              </div>
            )
          )}

          {/* Compteur de resultats */}
          {results.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 text-center">
              {results.length} resultat{results.length > 1 ? 's' : ''} trouve{results.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
