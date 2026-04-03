'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Scale, Search, ArrowRight, BookOpen, Clock, AlertTriangle, Loader2, ExternalLink, Zap } from 'lucide-react';
import { getLegalContext, getAvailableTypes, type DossierLegalContext } from '@/lib/legifrance/dossier-mapping';

const DEMO_STEPS = [
  { id: 1, label: 'Email entrant', href: '/demo/email-simulator' },
  { id: 2, label: 'Raisonnement dossier', href: '/demo/workspace-reasoning' },
  { id: 3, label: 'Preuve légale', href: '/demo/legal-proof' },
  { id: 4, label: 'Recherche Légifrance', href: '/demo/legifrance' },
];

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  RECOURS_OQTF: { label: 'Recours OQTF', icon: '⚠️', color: 'border-red-300 bg-red-50 hover:border-red-500' },
  TITRE_SEJOUR: { label: 'Titre de Séjour', icon: '📄', color: 'border-blue-300 bg-blue-50 hover:border-blue-500' },
  ASILE: { label: 'Demande d\'Asile', icon: '🛡️', color: 'border-orange-300 bg-orange-50 hover:border-orange-500' },
  NATURALISATION: { label: 'Naturalisation', icon: '🇫🇷', color: 'border-indigo-300 bg-indigo-50 hover:border-indigo-500' },
  REGROUPEMENT_FAMILIAL: { label: 'Regroupement Familial', icon: '👨‍👩‍👧', color: 'border-green-300 bg-green-50 hover:border-green-500' },
  VISA: { label: 'Visa Long Séjour', icon: '✈️', color: 'border-purple-300 bg-purple-50 hover:border-purple-500' },
};

interface SearchResult {
  id: string;
  title: string;
  highlight: string;
  source: 'local' | 'api';
}

export default function LegifranceDemoPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'fr';
  const withLocale = (path: string) => `/${locale}${path}`;

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [context, setContext] = useState<DossierLegalContext | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const selectType = (type: string) => {
    setSelectedType(type);
    setContext(getLegalContext(type));
    setExpandedArticle(null);
  };

  const handleSearch = async () => {
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
            source: 'local',
          });
        }
        for (const r of data.data?.apiResults || []) {
          results.push({ id: r.id, title: r.title, highlight: r.snippet || '', source: 'api' });
        }
        setSearchResults(results);
      }
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb démo */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white/90 p-3 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parcours de démonstration</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEMO_STEPS.map((step) => {
              const isActive = step.id === 4;
              return (
                <Link
                  key={step.id}
                  href={withLocale(step.href)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {step.id}
                  </span>
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Scale className="w-4 h-4" />
            Légifrance intégré dans MemoLib
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Le droit vient à l'avocat
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Sélectionnez un type de dossier pour voir les articles de loi, délais et jurisprudence
            s'afficher automatiquement — ou lancez une recherche libre dans tous les codes en vigueur.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Colonne gauche : sélection type + recherche */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sélection type de dossier */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                1. Choisir un type de dossier
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {getAvailableTypes().map((type) => {
                  const info = TYPE_LABELS[type];
                  if (!info) return null;
                  return (
                    <button
                      key={type}
                      onClick={() => selectType(type)}
                      className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedType === type
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : info.color
                      }`}
                    >
                      <span className="text-lg mr-2">{info.icon}</span>
                      <span className="font-medium text-gray-900">{info.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recherche libre */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                2. Recherche libre
              </h2>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="regroupement familial, L611-1..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={searching || searchQuery.length < 2}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chercher'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['OQTF sans délai', 'titre séjour conjoint', 'regroupement familial', 'naturalisation B1'].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setSearchQuery(q); }}
                    className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {searchResults.length > 0 && (
                <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                  {searchResults.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-3 h-3 text-indigo-500" />
                        <span className="text-xs font-medium">{r.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          r.source === 'local' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {r.source === 'local' ? 'local' : 'API PISTE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">{r.highlight}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne droite : résultat contextuel */}
          <div className="lg:col-span-3">
            {!context ? (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <Scale className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-lg font-medium text-slate-400">Sélectionnez un type de dossier</p>
                <p className="text-sm text-slate-300 mt-1">Les articles de loi et délais s'afficheront ici automatiquement</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header contexte */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4">
                  <h3 className="text-white font-bold text-lg">
                    {TYPE_LABELS[selectedType!]?.icon} {TYPE_LABELS[selectedType!]?.label}
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">
                    {context.articles.length} articles pertinents • {context.delaisLegaux.length} délais légaux
                  </p>
                </div>

                {/* Délais légaux */}
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">Délais légaux critiques</span>
                  </div>
                  <ul className="space-y-1.5">
                    {context.delaisLegaux.map((d, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Articles */}
                <div className="divide-y">
                  {context.articles.map((article) => {
                    const key = `${article.code}:${article.numero}`;
                    const isExpanded = expandedArticle === key;
                    return (
                      <div key={key}>
                        <button
                          onClick={() => setExpandedArticle(isExpanded ? null : key)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              article.pertinence === 'principal'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {article.numero}
                            </span>
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900">{article.titre}</span>
                              <p className="text-xs text-slate-500 mt-0.5">{article.description}</p>
                            </div>
                            <span className="text-[10px] text-slate-400">{article.code}</span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-3">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-xs text-slate-600 mb-2">
                                Cliquez sur le lien ci-dessous pour consulter le texte complet sur Légifrance.
                                En production, le texte s'affiche directement ici depuis les dépôts locaux.
                              </p>
                              <a
                                href={`https://www.legifrance.gouv.fr/search/all?tab_selection=all&query=${encodeURIComponent(article.code + ' ' + article.numero)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Voir sur Legifrance.gouv.fr
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Jurisprudence keywords */}
                <div className="p-4 bg-slate-50 border-t">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Recherche jurisprudentielle suggérée</p>
                  <div className="flex flex-wrap gap-2">
                    {context.jurisprudenceKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => setSearchQuery(kw)}
                        className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href={withLocale('/demo/legal-proof')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            ← Étape précédente : Preuve légale
          </Link>
          <Link
            href={withLocale('/demo/complete')}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Voir la démo complète guidée
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
