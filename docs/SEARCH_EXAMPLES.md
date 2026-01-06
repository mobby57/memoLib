# 🔍 Exemple d'Intégration - Recherche Intelligente

## Exemple 1: Ajouter la recherche dans Navigation.tsx

**Fichier:** `src/components/Navigation.tsx`

```tsx
import NavigationSearchButton from '@/components/NavigationSearchButton';

export function Navigation() {
  return (
    <nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">IA Poste Manager</h1>
      </div>

      {/* Recherche + Navigation */}
      <div className="flex items-center gap-6">
        {/* AJOUTEZ CETTE LIGNE */}
        <NavigationSearchButton />
        
        {/* Vos autres éléments de navigation */}
        <a href="/dashboard">Dashboard</a>
        <a href="/clients">Clients</a>
        <a href="/dossiers">Dossiers</a>
      </div>

      {/* User menu */}
      <div className="flex items-center gap-2">
        {/* ... */}
      </div>
    </nav>
  );
}
```

---

## Exemple 2: Widget dans AdminDashboard.tsx

**Fichier:** `src/components/dashboards/AdminDashboard.tsx`

```tsx
import QuickSearch from '@/components/QuickSearch';

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WIDGET DE RECHERCHE RAPIDE */}
        <QuickSearch className="md:col-span-1" />
        
        {/* VOS AUTRES WIDGETS */}
        <div className="md:col-span-2 space-y-6">
          <StatisticsWidget />
          <RecentActivitiesWidget />
        </div>
      </div>
    </div>
  );
}
```

---

## Exemple 3: Page de Clients avec recherche intégrée

**Fichier:** `src/app/clients/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { User } from 'lucide-react';

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState(null);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Mes Clients</h1>
        
        {/* RECHERCHE SPECIFIQUE AUX CLIENTS */}
        <SearchBar
          placeholder="Rechercher un client par nom, email ou téléphone..."
          showFilters={false}
          onResultClick={(result) => {
            if (result.type === 'client') {
              setSelectedClient(result);
              // Ou redirection: router.push(result.url)
            }
          }}
        />
      </div>

      {/* Affichage du client sélectionné */}
      {selectedClient && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h3 className="font-semibold">{selectedClient.title}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{selectedClient.subtitle}</p>
        </div>
      )}

      {/* Liste des clients */}
      <div className="mt-6">
        {/* Votre liste de clients existante */}
      </div>
    </div>
  );
}
```

---

## Exemple 4: Modal de sélection de document

**Fichier:** `src/components/DocumentPicker.tsx`

```tsx
'use client';

import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import { FileText, X } from 'lucide-react';

interface DocumentPickerProps {
  onSelect: (documentId: string) => void;
}

export default function DocumentPicker({ onSelect }: DocumentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <FileText className="w-4 h-4 inline mr-2" />
        Sélectionner un document
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Rechercher un document</h2>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* RECHERCHE DE DOCUMENTS */}
            <SearchBar
              placeholder="Chercher par nom, type ou contenu..."
              showFilters={true}
              onResultClick={(result) => {
                if (result.type === 'document') {
                  onSelect(result.id);
                  setIsOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// Utilisation:
// <DocumentPicker onSelect={(docId) => console.log('Selected:', docId)} />
```

---

## Exemple 5: Recherche programmée (sans UI)

**Fichier:** `src/utils/searchHelpers.ts`

```tsx
import { searchService } from '@/lib/services/searchService';

/**
 * Trouver tous les dossiers urgents d'un client
 */
export async function findClientUrgentDossiers(clientId: string, tenantId: string) {
  const results = await searchService.search('urgent', {
    types: ['dossier'],
    tenantId,
    limit: 20,
  });
  
  // Filtrer par client
  return results.filter(r => 
    r.metadata?.clientId === clientId && 
    (r.metadata?.statut === 'urgent' || r.metadata?.priorite === 'haute')
  );
}

/**
 * Rechercher tous les documents non signés
 */
export async function findUnsignedDocuments(tenantId: string) {
  const results = await searchService.search('non signé', {
    types: ['document'],
    tenantId,
  });
  
  return results.filter(r => r.metadata?.status === 'pending_signature');
}

/**
 * Rechercher les emails non lus d'aujourd'hui
 */
export async function findTodayUnreadEmails(tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const results = await searchService.search('', {
    types: ['email'],
    tenantId,
    dateFrom: today,
  });
  
  return results.filter(r => r.metadata?.unread === true);
}
```

---

## Exemple 6: Intégration avec analytics

**Fichier:** `src/lib/analytics/searchTracking.ts`

```tsx
import { searchService } from '@/lib/services/searchService';

interface SearchAnalytics {
  query: string;
  resultsCount: number;
  executionTime: number;
  userId: string;
  timestamp: Date;
}

const searchHistory: SearchAnalytics[] = [];

/**
 * Recherche avec tracking analytics
 */
export async function searchWithAnalytics(
  query: string, 
  userId: string,
  tenantId: string
) {
  const startTime = performance.now();
  
  const results = await searchService.search(query, {
    tenantId,
    limit: 50,
  });
  
  const executionTime = performance.now() - startTime;
  
  // Logger la recherche
  const analytics: SearchAnalytics = {
    query,
    resultsCount: results.length,
    executionTime,
    userId,
    timestamp: new Date(),
  };
  
  searchHistory.push(analytics);
  
  // Envoyer à votre service analytics
  await fetch('/api/analytics/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analytics),
  });
  
  return results;
}

/**
 * Obtenir les recherches les plus populaires
 */
export function getPopularSearches(limit = 10) {
  const queryCount = new Map<string, number>();
  
  searchHistory.forEach(({ query }) => {
    queryCount.set(query, (queryCount.get(query) || 0) + 1);
  });
  
  return Array.from(queryCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
}
```

---

## Exemple 7: Recherche avec cache Redis (optimisation)

**Fichier:** `src/lib/cache/searchCache.ts`

```tsx
import { searchService } from '@/lib/services/searchService';

// Simple in-memory cache (remplacer par Redis en production)
const cache = new Map<string, { results: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Recherche avec cache
 */
export async function cachedSearch(
  query: string,
  tenantId: string,
  options = {}
) {
  const cacheKey = `search:${tenantId}:${query}:${JSON.stringify(options)}`;
  
  // Vérifier le cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Cache HIT:', cacheKey);
    return cached.results;
  }
  
  console.log('❌ Cache MISS:', cacheKey);
  
  // Effectuer la recherche
  const results = await searchService.search(query, {
    tenantId,
    ...options,
  });
  
  // Mettre en cache
  cache.set(cacheKey, {
    results,
    timestamp: Date.now(),
  });
  
  return results;
}

/**
 * Invalider le cache (après création/modification)
 */
export function invalidateSearchCache(tenantId: string) {
  const keysToDelete: string[] = [];
  
  cache.forEach((_, key) => {
    if (key.startsWith(`search:${tenantId}:`)) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`🗑️  ${keysToDelete.length} cache entries invalidated`);
}
```

---

## Exemple 8: Hook React personnalisé

**Fichier:** `src/hooks/useSearch.ts`

```tsx
import { useState, useEffect, useCallback } from 'react';

interface UseSearchOptions {
  debounceMs?: number;
  minLength?: number;
  types?: string[];
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, minLength = 2, types } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minLength) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (types) {
        params.append('types', types.join(','));
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();
      
      setResults(data.results || []);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [minLength, types]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, performSearch, debounceMs]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    refetch: () => performSearch(query),
  };
}

// Utilisation:
// const { query, setQuery, results, isLoading } = useSearch({ types: ['client'] });
```

---

## 🎯 Cas d'usage pratiques

### 1. Recherche globale (Ctrl+K)
→ Utilisez `NavigationSearchButton` dans le header

### 2. Dashboard avec recherche rapide
→ Utilisez `QuickSearch` en widget

### 3. Page dédiée avec filtres
→ Utilisez `/search` page existante

### 4. Recherche contextuelle (ex: page Clients)
→ Utilisez `SearchBar` avec filtres

### 5. Modal de sélection
→ Utilisez `SearchBar` dans une modale custom

### 6. Recherche programmée
→ Utilisez directement `searchService.search()`

### 7. Analytics et tracking
→ Wrapper `searchService` avec votre logique

### 8. Optimisation avec cache
→ Wrapper avec cache Redis/Memory

---

## ✅ Checklist d'intégration

- [ ] Choisir le cas d'usage approprié
- [ ] Copier le code d'exemple
- [ ] Adapter les imports selon votre structure
- [ ] Tester avec `npm run dev`
- [ ] Vérifier que Ctrl+K fonctionne
- [ ] Valider les résultats de recherche
- [ ] Personnaliser les styles si besoin
- [ ] Ajouter des analytics (optionnel)

---

**Besoin d'aide ?** Consultez:
- `SEARCH_SYSTEM.md` - Documentation complète
- `SEARCH_INTEGRATION_GUIDE.md` - Guide pas à pas
