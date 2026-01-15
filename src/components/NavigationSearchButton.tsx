'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';

export default function NavigationSearchButton() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      {/* Bouton de recherche dans la navigation */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                   hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                   border border-gray-300 dark:border-gray-600"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Rechercher...</span>
        <kbd className="hidden md:inline px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
          Ctrl+K
        </kbd>
      </button>

      {/* Modal de recherche globale */}
      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
