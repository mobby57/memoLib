# 🚀 Guide d'intégration rapide - Recherche Intelligente

## ⚡ Démarrage rapide (5 minutes)

### Étape 1: Ajouter le bouton de recherche dans le header

**Fichier:** `src/app/(authenticated)/layout.tsx` ou votre layout principal

```tsx
import NavigationSearchButton from '@/components/NavigationSearchButton';

export default function AuthenticatedLayout({ children }) {
  return (
    <div>
      <header>
        <nav className="flex items-center justify-between p-4">
          {/* Votre logo et navigation */}
          
          {/* AJOUTEZ CETTE LIGNE */}
          <NavigationSearchButton />
        </nav>
      </header>
      
      <main>{children}</main>
    </div>
  );
}
```

✅ **Résultat:** Bouton de recherche avec raccourci Ctrl+K dans toute l'app

---

### Étape 2: Ajouter la recherche rapide dans le dashboard

**Fichier:** `src/app/dashboard/page.tsx` ou votre page dashboard

```tsx
import QuickSearch from '@/components/QuickSearch';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Widget de recherche rapide */}
      <QuickSearch className="md:col-span-1" />
      
      {/* Vos autres widgets */}
      <div className="md:col-span-2">
        {/* Statistiques, graphiques, etc. */}
      </div>
    </div>
  );
}
```

✅ **Résultat:** Widget de recherche avec suggestions dans le dashboard

---

### Étape 3: Tester la recherche

1. **Démarrer le serveur:**
   ```bash
   npm run dev
   ```

2. **Tester les raccourcis:**
   - Appuyez sur `Ctrl+K` (ou `Cmd+K` sur Mac)
   - La fenêtre de recherche devrait s'ouvrir
   - Tapez "martin" ou le nom d'un client existant

3. **Tester l'API directement:**
   ```bash
   # Dans un autre terminal
   curl "http://localhost:3000/api/search?q=test"
   ```

✅ **Résultat:** Système de recherche fonctionnel en 5 minutes !

---

## 📱 Exemples d'utilisation avancée

### Recherche avec filtres personnalisés

```tsx
'use client';

import SearchBar from '@/components/SearchBar';
import { useState } from 'react';

export default function ClientsPage() {
  const [selectedClient, setSelectedClient] = useState(null);

  return (
    <div>
      <h1>Mes Clients</h1>
      
      <SearchBar
        placeholder="Rechercher un client..."
        showFilters={false}
        onResultClick={(result) => {
          if (result.type === 'client') {
            setSelectedClient(result);
            // Redirection ou affichage détails
          }
        }}
      />
      
      {selectedClient && (
        <div>Client sélectionné: {selectedClient.title}</div>
      )}
    </div>
  );
}
```

### Recherche programmée (sans interface)

```tsx
import { searchService } from '@/lib/services/searchService';

async function findUrgentDossiers() {
  const results = await searchService.search('urgent', {
    types: ['dossier'],
    limit: 10,
    tenantId: 'your-tenant-id',
  });
  
  console.log('Dossiers urgents:', results);
}
```

### Intégration dans une modale

```tsx
import { useState } from 'react';
import SearchBar from '@/components/SearchBar';

export default function DocumentSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Sélectionner un document
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full">
            <SearchBar
              placeholder="Rechercher un document..."
              onResultClick={(result) => {
                if (result.type === 'document') {
                  setSelectedDoc(result);
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
```

---

## 🎨 Personnalisation du style

### Modifier les couleurs

**Créer:** `src/styles/search-theme.css`

```css
/* Personnalisation de la recherche */
.search-bar {
  --search-primary: #3b82f6;
  --search-bg: #ffffff;
  --search-border: #e5e7eb;
}

.dark .search-bar {
  --search-bg: #1f2937;
  --search-border: #374151;
}

/* Appliquer aux résultats */
.search-result:hover {
  background-color: var(--search-primary);
  color: white;
}
```

### Modifier les icônes

Dans `SearchBar.tsx`, modifiez la fonction `getIcon()`:

```tsx
import { Building, FileStack } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'client':
      return <Building className="w-4 h-4" />; // Icône personnalisée
    case 'dossier':
      return <FileStack className="w-4 h-4" />; // Icône personnalisée
    // ...
  }
};
```

---

## 🔌 Intégration avec d'autres services

### Recherche avec Analytics

```tsx
import { searchService } from '@/lib/services/searchService';
import { trackEvent } from '@/lib/analytics';

async function searchWithTracking(query: string) {
  const startTime = performance.now();
  
  const results = await searchService.search(query, {
    tenantId: getCurrentTenantId(),
  });
  
  const duration = performance.now() - startTime;
  
  // Tracker la recherche
  trackEvent('search_performed', {
    query,
    results_count: results.length,
    duration_ms: duration,
  });
  
  return results;
}
```

### Recherche avec cache

```tsx
import { searchService } from '@/lib/services/searchService';

const searchCache = new Map();

async function cachedSearch(query: string) {
  // Vérifier le cache
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }
  
  // Effectuer la recherche
  const results = await searchService.search(query);
  
  // Mettre en cache (5 minutes)
  searchCache.set(query, results);
  setTimeout(() => searchCache.delete(query), 5 * 60 * 1000);
  
  return results;
}
```

---

## 🐛 Résolution des problèmes courants

### Problème: "searchService is not defined"

**Solution:** Vérifier l'export dans `searchService.ts`:

```tsx
// Ajouter à la fin du fichier
export const searchService = new SearchService();
```

### Problème: Les résultats sont vides

**Diagnostic:**
1. Vérifier que des données existent dans la base
2. Vérifier le `tenantId` de l'utilisateur
3. Vérifier les logs de l'API `/api/search`

**Fix:**
```tsx
// Tester sans filtre tenant temporairement
const results = await searchService.search(query, {
  // tenantId: undefined, // Temporaire pour debug
  types: ['client'],
});
```

### Problème: "Cannot read property 'map' of undefined"

**Solution:** Toujours initialiser results:

```tsx
const [results, setResults] = useState<SearchResult[]>([]); // Tableau vide par défaut

// Vérifier avant de mapper
{results && results.length > 0 && results.map(result => (
  // ...
))}
```

### Problème: Erreur TypeScript sur SearchResult

**Solution:** Importer les types correctement:

```tsx
import type { SearchResult } from '@/lib/services/searchService';
```

---

## 📊 Monitoring et Performance

### Mesurer les performances

```tsx
import { searchService } from '@/lib/services/searchService';

async function benchmarkSearch() {
  const queries = ['martin', 'dossier', 'urgent', 'email'];
  
  for (const query of queries) {
    const start = performance.now();
    await searchService.search(query);
    const duration = performance.now() - start;
    
    console.log(`${query}: ${duration.toFixed(2)}ms`);
  }
}
```

### Logger les recherches populaires

**Créer:** `lib/services/searchLogger.ts`

```tsx
import { prisma } from '@/lib/prisma';

export async function logSearch(userId: string, query: string, resultCount: number) {
  await prisma.searchLog.create({
    data: {
      userId,
      query,
      resultCount,
      timestamp: new Date(),
    },
  });
}

export async function getPopularSearches(limit = 10) {
  const logs = await prisma.searchLog.groupBy({
    by: ['query'],
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
  });
  
  return logs.map(log => log.query);
}
```

---

## ✅ Checklist d'intégration

- [ ] `npm install @headlessui/react` installé
- [ ] SearchBar importé dans au moins une page
- [ ] NavigationSearchButton ajouté au header
- [ ] GlobalSearch testé avec Ctrl+K
- [ ] API `/api/search` répond correctement
- [ ] Au moins 1 résultat de recherche affiché
- [ ] Filtres par type fonctionnels
- [ ] Suggestions affichées (optionnel)
- [ ] QuickSearch dans le dashboard (optionnel)
- [ ] Documentation lue et comprise

---

## 🎓 Prochaines étapes

Une fois l'intégration de base terminée :

1. **Améliorer l'UX:**
   - Ajouter des animations
   - Personnaliser les couleurs
   - Ajouter des sons (optionnel)

2. **Optimiser les performances:**
   - Implémenter le cache
   - Ajouter la pagination
   - Indexer la base de données

3. **Ajouter des features:**
   - Recherche vocale
   - Historique de recherche
   - Recherche sauvegardée
   - Export de résultats

4. **Analytics:**
   - Tracker les recherches populaires
   - Mesurer le taux de succès
   - Identifier les termes sans résultat

---

## 📞 Support

Problème non résolu ? 

1. Consulter [SEARCH_SYSTEM.md](./SEARCH_SYSTEM.md)
2. Vérifier les logs du serveur
3. Tester l'API avec `curl`
4. Créer une issue avec:
   - Version de Node.js
   - Message d'erreur complet
   - Code reproduisant l'erreur

---

**Temps d'intégration estimé:** 5-15 minutes  
**Niveau:** Débutant à Intermédiaire  
**Prérequis:** Next.js 14+, TypeScript, Prisma
