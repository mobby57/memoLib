'use client';

/**
 * LegifrancePanel — Panneau contextuel juridique
 *
 * S'affiche a cote du formulaire dossier et montre automatiquement :
 * - Les articles de loi applicables au type de dossier
 * - Les delais legaux critiques
 * - La jurisprudence recente
 * - Un moteur de recherche Legifrance integre
 */

import { useState, useEffect, useCallback } from 'react';
import { Scale, Clock, Search, BookOpen, ExternalLink, ChevronDown, ChevronUp, AlertTriangle, Loader2 } from 'lucide-react';
import { getLegalContext, type ArticleReference, type DossierLegalContext } from '@/lib/legifrance/dossier-mapping';

interface LegifrancePanelProps {
  typeDossier?: string;
  fondement?: string;
  className?: string;
}

interface SearchResult {
  id: string;
  title: string;
  highlight: string;
  code: string;
  source: 'local' | 'api';
}

export function LegifrancePanel({ typeDossier, fondement, className = '' }: LegifrancePanelProps) {
  const [context, setContext] = useState<DossierLegalContext | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [articleContent, setArticleContent] = useState<Record<string, string>>({});
  const [loadingArticle, setLoadingArticle] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'jurisprudence' | 'recherche'>('articles');

  useEffect(() => {
    if (typeDossier) {
      const ctx = getLegalContext(typeDossier, fondement);
      setContext(ctx);
      setExpandedArticle(null);
      setArticleContent({});
    } else {
      setContext(null);
    }
  }, [typeDossier, fondement]);

  const loadArticleContent = useCallback(async (article: ArticleReference) => {
    const key = `${article.code}:${article.numero}`;
    if (articleContent[key]) return;

    setLoadingArticle(key);
    try {
      const res = await fetch('/api/legifrance/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unified-search',
          params: { query: `${article.code} ${article.numero}`, codes: [article.code], maxLocal: 3, maxApi: 1 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const local = data.data?.localResults?.[0];
        const content = local?.article?.contenu || local?.highlight || 'Contenu non disponible localement. Lancez `npm run legifrance:sync` pour telecharger les codes.';
        setArticleContent((prev) => ({ ...prev, [key]: content }));
      }
    } catch {
      setArticleContent((prev) => ({ ...prev, [key]: 'Erreur de chargement.' }));
    } finally {
      setLoadingArticle(null);
    }
  }, [articleContent]);

  const toggleArticle = (article: ArticleReference) => {
    const key = `${article.code}:${article.numero}`;
    if (expandedArticle === key) {
      setExpandedArticle(null);
    } else {
      setExpandedArticle(key);
      loadArticleContent(article);
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await fetch('/api/legifrance/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unified-search',
          params: { query: searchQuery, maxLocal: 10, maxApi: 5 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const results: SearchResult[] = [];

        for (const r of data.data?.localResults || []) {
          results.push({
            id: r.article.id,
            title: `${r.article.code} — Art. ${r.article.numero}`,
            highlight: r.highlight,
            code: r.article.code,
            source: 'local',
          });
        }
        for (const r of data.data?.apiResults || []) {
          results.push({
            id: r.id,
            title: r.title,
            highlight: r.snippet || '',
            code: r.type,
            source: 'api',
          });
        }

        setSearchResults(results);
      }
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  if (!typeDossier) {
    return (
      <div className={`bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-500 ${className}`}>
        <Scale className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">Selectionnez un type de dossier pour voir les textes applicables</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Scale className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Legifrance — Textes applicables</h3>
        </div>
        {context && (
          <p className="text-blue-100 text-xs mt-1">{context.articles.length} articles pertinents</p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {(['articles', 'jurisprudence', 'recherche'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'articles' && 'Articles'}
            {tab === 'jurisprudence' && 'Jurisprudence'}
            {tab === 'recherche' && 'Recherche'}
          </button>
        ))}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {/* Tab: Articles */}
        {activeTab === 'articles' && context && (
          <div className="divide-y divide-slate-100">
            {/* Delais legaux en alerte */}
            {context.delaisLegaux.length > 0 && (
              <div className="p-3 bg-amber-50 border-b border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Delais legaux</span>
                </div>
                <ul className="space-y-1">
                  {context.delaisLegaux.map((d, i) => (
                    <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                      <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Articles principaux */}
            {context.articles.filter((a) => a.pertinence === 'principal').map((article) => (
              <ArticleRow
                key={`${article.code}:${article.numero}`}
                article={article}
                expanded={expandedArticle === `${article.code}:${article.numero}`}
                content={articleContent[`${article.code}:${article.numero}`]}
                loading={loadingArticle === `${article.code}:${article.numero}`}
                onToggle={() => toggleArticle(article)}
              />
            ))}

            {/* Articles complementaires */}
            {context.articles.filter((a) => a.pertinence === 'complementaire').length > 0 && (
              <div className="px-3 py-2 bg-slate-50">
                <span className="text-xs font-medium text-slate-500">Articles complementaires</span>
              </div>
            )}
            {context.articles.filter((a) => a.pertinence === 'complementaire').map((article) => (
              <ArticleRow
                key={`${article.code}:${article.numero}`}
                article={article}
                expanded={expandedArticle === `${article.code}:${article.numero}`}
                content={articleContent[`${article.code}:${article.numero}`]}
                loading={loadingArticle === `${article.code}:${article.numero}`}
                onToggle={() => toggleArticle(article)}
              />
            ))}
          </div>
        )}

        {/* Tab: Jurisprudence */}
        {activeTab === 'jurisprudence' && context && (
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">Mots-cles de recherche jurisprudentielle :</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {context.jurisprudenceKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => { setSearchQuery(kw); setActiveTab('recherche'); }}
                  className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Cliquez sur un mot-cle pour lancer une recherche dans la jurisprudence.
            </p>
          </div>
        )}

        {/* Tab: Recherche */}
        {activeTab === 'recherche' && (
          <div className="p-3">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Article, mot-cle, notion..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || searchQuery.length < 2}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((r) => (
                  <div key={r.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-3 h-3 text-blue-500" />
                      <span className="text-xs font-medium text-slate-800">{r.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        r.source === 'local' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.source === 'local' ? 'local' : 'API'}
                      </span>
                    </div>
                    {r.highlight && (
                      <p className="text-xs text-slate-600 line-clamp-3">{r.highlight}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
              <p className="text-xs text-slate-400 text-center py-4">Aucun resultat. Essayez d'autres termes.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleRow({ article, expanded, content, loading, onToggle }: {
  article: ArticleReference;
  expanded: boolean;
  content?: string;
  loading: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button onClick={onToggle} className="w-full px-3 py-2.5 text-left hover:bg-slate-50 transition-colors">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700">{article.numero}</span>
              <span className="text-xs text-slate-700 font-medium truncate">{article.titre}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{article.description}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[10px] text-slate-400">{article.code}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-blue-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                Chargement du texte...
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {content || 'Contenu non disponible.'}
                </p>
                <a
                  href={`https://www.legifrance.gouv.fr/search/all?tab_selection=all&query=${encodeURIComponent(article.code + ' ' + article.numero)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-[11px] text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Voir sur Legifrance.gouv.fr
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
