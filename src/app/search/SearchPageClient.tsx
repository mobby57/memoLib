'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Download, Filter, Share2, SlidersHorizontal, Sparkles, Tag } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

interface AdvancedFilters {
  dateRange?: { start: Date; end: Date };
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
}

export default function SearchPageClient() {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') ?? '';

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({});
  const [searchStats] = useState({
    totalResults: 0,
    executionTime: 0,
    indexedDocuments: 0,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-sky-500" />
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Plateforme IA Poste Manager</p>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Recherche intelligente</h1>
            </div>
          </div>
        </header>

        <section>
          <SearchBar placeholder="Rechercher dossiers, clients, emails..." showFilters />
        </section>

        {currentQuery && (
          <section className="text-sm text-slate-600 dark:text-slate-300">
            Résultats pour <span className="font-semibold">{currentQuery}</span>
          </section>
        )}

        <section className="flex flex-col gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${
                showAdvancedFilters
                  ? 'border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                  : 'bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtres avancés
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{searchStats.totalResults} résultats</span>
              <span>•</span>
              <span>{searchStats.executionTime} ms</span>
              <span>•</span>
              <span>{searchStats.indexedDocuments} documents indexés</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
              <Share2 className="w-4 h-4" /> Partager
            </button>
          </div>
        </section>

        {showAdvancedFilters && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                  <Calendar className="w-4 h-4" /> Période
                </div>
                <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option>Toutes les dates</option>
                  <option>Aujourd'hui</option>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                  <option>Cette année</option>
                  <option>Personnalisé</option>
                </select>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                  <Filter className="w-4 h-4" /> Statut
                </div>
                <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option>Tous les statuts</option>
                  <option>En cours</option>
                  <option>Terminé</option>
                  <option>En attente</option>
                  <option>Urgent</option>
                </select>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                  <Tag className="w-4 h-4" /> Tags
                </div>
                <input
                  type="text"
                  placeholder="Ajoutez des tags"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 text-sm">
              <button className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700">Réinitialiser</button>
              <button className="px-4 py-2 rounded-lg bg-sky-600 text-white">Appliquer</button>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 text-slate-900 dark:text-white">
            <p className="text-sm font-semibold">Conseils de recherche</p>
            <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
              <li>"mot exact" → recherche précise</li>
              <li>type:client → filtrer par type</li>
              <li>after:2024-01-01 → données postérieures</li>
              <li>-mot → exclure un terme</li>
              <li>mot1 OR mot2 → opérateur logique</li>
              <li>Use * pour wildcards, ex: doc*</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Tendance</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">+14%</p>
              <p className="text-xs text-slate-500">dossiers retrouvés cette semaine</p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Précision</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">92%</p>
              <p className="text-xs text-slate-500">de résultats pertinents</p>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-slate-400">Indices</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">4</p>
              <p className="text-xs text-slate-500">suggestions contextuelles actives</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
