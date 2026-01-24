'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import { 
  Filter, 
  Calendar, 
  Tag, 
  SlidersHorizontal,
  Download,
  Share2,
  Sparkles
} from 'lucide-react';

interface AdvancedFilters {
  dateRange?: { start: Date; end: Date };
  status?: string[];
  priority?: string[];
  assignedTo?: string[];
  tags?: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({});
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    executionTime: 0,
    indexedDocuments: 0,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tete */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Recherche Intelligente
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Trouvez rapidement tous vos clients, dossiers, documents et emails
          </p>
        </div>

        {/* Barre de recherche principale */}
        <div className="mb-6">
          <SearchBar 
            placeholder="Rechercher dans toute l'application..."
            showFilters={true}
          />
        </div>

        {/* Barre d'outils */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-medium">Filtres avances</span>
            </button>

            {searchStats.totalResults > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{searchStats.totalResults}</span> resultats
                <span className="mx-2">-</span>
                <span>{searchStats.executionTime}ms</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtres avances */}
        {showAdvancedFilters && (
          <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Filtres avances
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Plage de dates */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4" />
                  Periode
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Toutes les dates</option>
                  <option>Aujourd'hui</option>
                  <option>Cette semaine</option>
                  <option>Ce mois</option>
                  <option>Cette annee</option>
                  <option>Personnalise</option>
                </select>
              </div>

              {/* Statut */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Filter className="w-4 h-4" />
                  Statut
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option>Tous les statuts</option>
                  <option>En cours</option>
                  <option>Termine</option>
                  <option>En attente</option>
                  <option>Urgent</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Entrez des tags..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Reinitialiser
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}

        {/* Guide de recherche */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            [emoji] Conseils de recherche
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <strong>Recherche exacte :</strong> Utilisez des guillemets "mot exact"
            </div>
            <div>
              <strong>Exclure des mots :</strong> Utilisez le signe moins -motexclu
            </div>
            <div>
              <strong>Recherche par type :</strong> type:client, type:dossier, etc.
            </div>
            <div>
              <strong>Recherche par date :</strong> date:2024-01 ou after:2024-01-01
            </div>
            <div>
              <strong>Operateur OU :</strong> mot1 OR mot2
            </div>
            <div>
              <strong>Wildcards :</strong> Utilisez * pour remplacer plusieurs caracteres
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}
