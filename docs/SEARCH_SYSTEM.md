# 🔍 Système de Recherche Intelligente - iaPostemanage

## Vue d'ensemble

Le système de recherche intelligente permet de rechercher instantanément dans toute l'application : clients, dossiers, documents et emails. Il utilise un algorithme de scoring avancé avec fuzzy matching et suggestions automatiques.

## 🚀 Fonctionnalités

### Recherche Multi-Entités
- ✅ **Clients** : Recherche par nom, prénom, email, téléphone
- ✅ **Dossiers** : Recherche par numéro, objet, type, statut
- ✅ **Documents** : Recherche par nom, contenu, type MIME
- ✅ **Emails** : Recherche par sujet, expéditeur, contenu

### Algorithme de Scoring
```typescript
Score total = Base score + Priority bonus + Fuzzy match bonus

Base scores:
- Correspondance exacte: 100 points
- Commence par: 50 points
- Contient: 25 points
- Fuzzy match: 10 points

Bonus priorité:
- Email urgent: +5 points
- Email non lu: +5 points
- Dossier critique: +10 points
```

### Suggestions Intelligentes
- Autocomplete basé sur les noms de clients
- Suggestions de numéros de dossier
- Types de documents fréquents
- Top 5 suggestions les plus pertinentes

## 📦 Architecture

```
lib/services/searchService.ts      # Service principal de recherche
src/app/api/search/route.ts        # API endpoint principal
src/app/api/search/suggestions/    # API suggestions
src/components/SearchBar.tsx       # Composant barre de recherche
src/components/GlobalSearch.tsx    # Modal recherche globale (Ctrl+K)
src/components/QuickSearch.tsx     # Widget recherche rapide
src/app/search/page.tsx            # Page recherche avancée
```

## 🔧 Utilisation

### 1. Intégration de base

```tsx
import SearchBar from '@/components/SearchBar';

export default function MyPage() {
  return (
    <SearchBar
      placeholder="Rechercher..."
      showFilters={true}
      onResultClick={(result) => {
        console.log('Clicked:', result);
      }}
    />
  );
}
```

### 2. Recherche globale avec Ctrl+K

```tsx
import { useGlobalSearch } from '@/components/GlobalSearch';

export default function Layout() {
  const { isOpen, close } = useGlobalSearch();
  
  return (
    <>
      <GlobalSearch isOpen={isOpen} onClose={close} />
      {/* Votre contenu */}
    </>
  );
}
```

### 3. Widget de recherche rapide

```tsx
import QuickSearch from '@/components/QuickSearch';

export default function Dashboard() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <QuickSearch className="col-span-1" />
      {/* Autres widgets */}
    </div>
  );
}
```

### 4. Bouton de navigation

```tsx
import NavigationSearchButton from '@/components/NavigationSearchButton';

export default function Header() {
  return (
    <nav>
      {/* Autres éléments de navigation */}
      <NavigationSearchButton />
    </nav>
  );
}
```

## 🎯 API Endpoints

### POST /api/search

Recherche dans toutes les entités.

**Query Parameters:**
- `q` (required): Terme de recherche
- `types` (optional): Filtrer par types séparés par virgules (`client,dossier,document,email`)
- `limit` (optional): Nombre maximum de résultats (défaut: 20)

**Response:**
```json
{
  "results": [
    {
      "id": "123",
      "type": "client",
      "title": "Martin Dupont",
      "subtitle": "martin.dupont@email.com",
      "description": "Client depuis 2023...",
      "score": 85,
      "url": "/clients/123",
      "date": "2024-01-01",
      "tags": ["actif", "prioritaire"]
    }
  ],
  "totalCount": 42,
  "executionTime": 45
}
```

### GET /api/search/suggestions

Obtenir des suggestions d'autocomplétion.

**Query Parameters:**
- `q` (required): Début du terme de recherche (min 2 caractères)

**Response:**
```json
{
  "suggestions": [
    "Martin Dupont",
    "Marie Martin",
    "Dossier CESEDA 2024",
    "Documents urgents"
  ]
}
```

## 🎨 Personnalisation

### Modifier les couleurs par type

Dans `SearchBar.tsx`:

```typescript
const getTypeColor = (type: string) => {
  switch (type) {
    case 'client':
      return 'bg-blue-100 text-blue-700';
    case 'dossier':
      return 'bg-green-100 text-green-700';
    // Ajoutez vos couleurs personnalisées
  }
};
```

### Ajuster l'algorithme de scoring

Dans `lib/services/searchService.ts`:

```typescript
private calculateScore(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText === lowerQuery) return 100; // Exact
  if (lowerText.startsWith(lowerQuery)) return 50; // Commence par
  if (lowerText.includes(lowerQuery)) return 25; // Contient
  if (this.fuzzyMatch(lowerText, lowerQuery)) return 10; // Fuzzy
  
  return 0;
}
```

### Ajouter des filtres personnalisés

Dans `src/app/search/page.tsx`:

```typescript
interface AdvancedFilters {
  dateRange?: { start: Date; end: Date };
  status?: string[];
  priority?: string[];
  // Ajoutez vos filtres
  customField?: string;
}
```

## 🔐 Sécurité

### Isolation tenant
Toutes les recherches sont automatiquement filtrées par tenant :

```typescript
const userTenantId = session.user.tenantId;
// Seuls les résultats du tenant de l'utilisateur sont retournés
```

### Authentification
Les endpoints de recherche nécessitent une session active :

```typescript
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 📊 Performance

### Optimisations implémentées
- ✅ Recherche parallèle avec `Promise.all()`
- ✅ Debounce de 300ms sur les saisies utilisateur
- ✅ Limitation à 20 résultats par défaut
- ✅ Indexation des champs de recherche dans Prisma
- ✅ Extraction de snippets avec contexte limité

### Recommandations
1. Ajouter un index full-text sur les champs texte (PostgreSQL)
2. Implémenter la pagination pour > 100 résultats
3. Mettre en cache les suggestions populaires
4. Utiliser Elasticsearch pour des recherches très volumineuses

## 🧪 Tests

### Test de l'API
```bash
# Recherche simple
curl "http://localhost:3000/api/search?q=martin"

# Recherche avec filtres
curl "http://localhost:3000/api/search?q=urgent&types=email,dossier"

# Suggestions
curl "http://localhost:3000/api/search/suggestions?q=mar"
```

### Test du composant
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';

test('SearchBar affiche les résultats', async () => {
  render(<SearchBar />);
  const input = screen.getByPlaceholderText(/rechercher/i);
  fireEvent.change(input, { target: { value: 'test' } });
  
  // Attendre les résultats
  await waitFor(() => {
    expect(screen.getByText(/résultats/i)).toBeInTheDocument();
  });
});
```

## 🚦 Raccourcis clavier

| Raccourci | Action |
|-----------|--------|
| `Ctrl+K` / `Cmd+K` | Ouvrir la recherche globale |
| `Esc` | Fermer la recherche |
| `↑` / `↓` | Naviguer dans les résultats |
| `Enter` | Sélectionner un résultat |

## 📝 Syntaxe de recherche avancée

```
"exacte"           # Recherche exacte
-exclu             # Exclure un mot
type:client        # Filtrer par type
date:2024-01       # Filtrer par date
after:2024-01-01   # Après une date
urgent OR prioritaire  # Opérateur OU
client* # Wildcard (tous les mots commençant par "client")
```

## 🔄 Mises à jour futures

- [ ] Recherche vocale
- [ ] Recherche dans les PDF
- [ ] Historique de recherche persistant
- [ ] Recherche sémantique avec IA
- [ ] Export des résultats
- [ ] Recherche sauvegardée (bookmarks)
- [ ] Analytics de recherche
- [ ] Suggestions basées sur l'ML

## 📚 Ressources

- [Prisma Full-Text Search](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Fuzzy Matching Algorithms](https://en.wikipedia.org/wiki/Approximate_string_matching)

## 🐛 Dépannage

### Les résultats ne s'affichent pas
1. Vérifier que l'API `/api/search` répond
2. Vérifier la console du navigateur
3. Vérifier que le tenant de l'utilisateur est correct
4. Vérifier les permissions de la session

### Les suggestions sont lentes
1. Augmenter le debounce à 500ms
2. Réduire la limite de suggestions à 3
3. Mettre en cache les résultats fréquents

### Erreur "Unauthorized"
1. Vérifier que l'utilisateur est connecté
2. Vérifier que la session NextAuth est valide
3. Vérifier les cookies de session

## 👥 Contribution

Pour contribuer au système de recherche :
1. Créer une branche `feature/search-improvement`
2. Implémenter et tester vos changements
3. Créer une Pull Request avec des tests
4. Documenter les nouvelles fonctionnalités

## 📄 Licence

Ce système est propriétaire et fait partie de l'application iaPostemanage.

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2024-01-01  
**Auteur:** Équipe iaPostemanage
