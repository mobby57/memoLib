'use client';

import { useState, useMemo } from 'react';
import { ALL_PACKS, getAvailableCategories } from '@/lib/ceseda/pack-registry';
import type { LegalPack, ProcedureCategory } from '@/lib/ceseda/types';
import { FileText, ArrowRight, Shield, Clock, Users, Globe } from 'lucide-react';

const CATEGORY_LABELS: Record<ProcedureCategory, string> = {
  'titres-sejour': 'Titres de séjour',
  'asile': 'Asile',
  'eloignement': 'Éloignement',
  'regroupement-familial': 'Regroupement familial',
  'nationalite': 'Nationalité',
  'retention': 'Rétention',
  'visas': 'Visas',
  'contentieux': 'Contentieux',
};

const CATEGORY_ICONS: Record<ProcedureCategory, React.ElementType> = {
  'titres-sejour': FileText,
  'asile': Shield,
  'eloignement': Clock,
  'regroupement-familial': Users,
  'nationalite': Globe,
  'retention': Shield,
  'visas': Globe,
  'contentieux': FileText,
};

interface PackSelectorProps {
  onSelect: (pack: LegalPack) => void;
  selectedPackId?: string;
}

export function PackSelector({ onSelect, selectedPackId }: PackSelectorProps) {
  const [filter, setFilter] = useState<ProcedureCategory | 'all'>('all');

  const categories = useMemo(() => getAvailableCategories(), []);
  const filteredPacks = useMemo(
    () => (filter === 'all' ? ALL_PACKS : ALL_PACKS.filter((p) => p.category === filter)),
    [filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par catégorie">
        <button
          role="tab"
          aria-selected={filter === 'all'}
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          Toutes ({ALL_PACKS.length})
        </button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const count = ALL_PACKS.filter((p) => p.category === cat).length;
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={filter === cat}
              onClick={() => setFilter(cat)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPacks.map((pack) => {
          const Icon = CATEGORY_ICONS[pack.category];
          const isSelected = selectedPackId === pack.id;
          return (
            <button
              key={pack.id}
              onClick={() => onSelect(pack)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{pack.label}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{pack.article}</p>
                  </div>
                </div>
                <ArrowRight className={`w-5 h-5 ${isSelected ? 'text-blue-600 translate-x-1' : 'text-gray-400'}`} aria-hidden="true" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{pack.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  {pack.deadlines.length} échéances
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                  {pack.documents.length} pièces
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}