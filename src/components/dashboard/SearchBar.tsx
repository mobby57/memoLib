'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Folder, X } from 'lucide-react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'client' | 'dossier';
  title: string;
  subtitle?: string;
  href: string;
}

export function SearchBar({ tenantId }: { tenantId?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, limit: '8' });
      if (tenantId) params.set('tenantId', tenantId);
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.results || []).map((r: any) => ({
          id: r.id,
          type: r.type || (r.clientName ? 'client' : 'dossier'),
          title: r.title || r.name || r.numero || 'Sans titre',
          subtitle: r.subtitle || r.clientName || r.email || '',
          href: r.type === 'client' ? `/clients/${r.id}` : `/dossiers/${r.id}`,
        })));
      }
    } catch { setResults([]); }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher client, dossier..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {focused && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-sm text-gray-400 text-center">Recherche...</p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-gray-400 text-center">Aucun résultat pour &quot;{query}&quot;</p>
          ) : (
            results.map(r => (
              <Link key={r.id} href={r.href}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b last:border-0">
                {r.type === 'client' 
                  ? <User className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  : <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                  {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                </div>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{r.type === 'client' ? 'Client' : 'Dossier'}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
