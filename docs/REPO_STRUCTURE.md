# Organisation du dépôt

Ce document décrit la structure logique du dépôt et les conventions d’import.

- `src/app/` — Application Next.js (App Router), pages, layouts, API routes.
- `src/components/` — Composants UI et modules réutilisables.
- `src/lib/` — Bibliothèque applicative (domaines, services, utilitaires). Un fichier d’entrée `src/lib/index.ts` centralise les exports.
- `src/__tests__/` — Tests unitaires et d’intégration organisés par domaine.
- `prisma/` — Schémas et outils de base de données.
- `docs/` — Documentation (CI/CD, environnements, dédup, etc.).
- `.github/workflows/` — Pipelines CI/CD (preview et production).

## Conventions d’import

Utilisez les alias TypeScript:

- `@/lib/*` pour la librairie applicative
- `@/components/*` pour les composants
- `@/app/*` pour l’application

Exemples:

```ts
import { normalizeName } from '@/lib/dedup';
import { Button } from '@/components/ui/Button';
import SomeApi from '@/app/api/...';
```

## Règles de placement

- Les endpoints App Router: `src/app/api/.../route.ts`
- Les utilitaires réutilisables: `src/lib/*`
- Les tests proches du domaine testé: `src/__tests__/<domaine>/**`

## Objectif

Réduire les chemins relatifs profonds, améliorer la lisibilité et la maintenabilité, et uniformiser les imports via alias.
