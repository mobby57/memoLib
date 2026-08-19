'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, User, Folder, Mail, Clock, ArrowRight, Command, Sparkles } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'client' | 'dossier' | 'email' | 'document';
  title: string;
  subtitle?: string;
  href: string;
  score?: number;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  client: { icon: User, color: 'text-blue-500 bg-blue-50', label: 'Client' },
  dossier: { icon: Folder, color: 'text-purple-500 bg-purple-50', label: 'Dossier' },
  email: { icon: Mail, color: 'text-green-500 bg-green-50', label: 'Email' },
  document: { icon: FileText, color: 'text-orange-500 bg-orange-50', label: 'Document' },
};

/**
 * Command Palette — Recherche globale (Ctrl+K / Cmd+K)
 * Cherche dans clients, dossiers, emails, documents en temps réel.
 */
export function CommandPaletteGlobal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();

  // Ouvrir avec Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input quand ouvert
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Recherche avec debounce
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults((data.results || []).map((r: any) => ({
          id: r.id,
          type: r.type,
          title: r.title || r.name || r.subject || 'Sans titre',
          subtitle: r.subtitle || r.email || r.numero || '',
          href: getHref(r),
          score: r.score,
        })));
      }
    } catch {}
    setLoading(false);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].href);
    }
  };

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-500 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Rechercher...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border rounded text-xs text-gray-400">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto max-w-xl px-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chercher un client, dossier, email, document..."
              className="flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
              autoComplete="off"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-400">Esc</kbd>
          </div>

          {/* Résultats */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 && query.length >= 2 && !loading && (
              <div className="px-4 py-8 text-center text-gray-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucun résultat pour &quot;{query}&quot;</p>
              </div>
            )}

            {results.length === 0 && query.length < 2 && (
              <div className="px-4 py-6 text-center text-gray-400">
                <p className="text-sm">Tapez au moins 2 caractères pour chercher</p>
                <div className="flex justify-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> Clients</span>
                  <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Dossiers</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Emails</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Documents</span>
                </div>
              </div>
            )}

            {results.map((result, idx) => {
              const config = TYPE_CONFIG[result.type] || TYPE_CONFIG.document;
              const Icon = config.icon;
              return (
                <button
                  key={result.id}
                  onClick={() => navigate(result.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    idx === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400 capitalize">{config.label}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
            <div className="flex gap-3">
              <span>↑↓ Naviguer</span>
              <span>↵ Ouvrir</span>
              <span>Esc Fermer</span>
            </div>
            <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getHref(result: any): string {
  switch (result.type) {
    case 'client': return `/admin/clients/${result.id}`;
    case 'dossier': return `/dossiers/${result.id}`;
    case 'email': return `/emails/${result.id}`;
    case 'document': return `/documents/${result.id}`;
    default: return '/';
  }
}
