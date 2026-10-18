# MemoLib — instructions Copilot

## Commandes

Utiliser Node.js 22 pour reproduire la CI (le projet accepte Node.js 20+).

```powershell
npm run dev                    # serveur Next.js local
npm run lint                   # ESLint sur src/
npm run type-check             # TypeScript sans émission
npm test                       # suite Vitest par défaut
npm run test:ci                # sous-ensemble exécuté en CI
npm run test:components        # composants/hooks, environnement jsdom
npm run test:integration       # intégration, requiert DATABASE_URL et éventuelles clés API
npm run build                  # génère aussi le SEO avant le build Next.js
```

Pour cibler un test, lancer directement son runner :

```powershell
npx vitest run src/__tests__/api/example.test.ts
npx vitest run --config vitest.components.config.ts src/__tests__/components/example.test.tsx
npx vitest run --config vitest.integration.config.ts src/__tests__/integration/example.test.ts
npx playwright test tests/e2e/main-flow.spec.ts --project=chromium
```

Playwright démarre `npm run dev` par défaut ; définir `PLAYWRIGHT_SKIP_WEBSERVER=true`
seulement lorsqu'un serveur compatible est déjà disponible. La validation CI est
`lint`, `type-check`, `test:ci`, puis `build`. Écrire les nouveaux tests avec
Vitest (`import { ... } from 'vitest'`) ; ne pas étendre les usages historiques de Jest.

## Architecture

- MemoLib est un monolithe modulaire Next.js App Router : les pages et Route
  Handlers constituent la frontière applicative ; Prisma est l'unique ORM
  applicatif vers PostgreSQL. Ne pas introduire un backend généraliste parallèle.
- Les routes réelles sont sous `src/app/[locale]`. Le `RootLayout` reste sans
  `ClerkProvider` : celui-ci est intentionnellement limité au layout localisé
  afin de préserver le pré-rendu Next. Les providers client (React Query,
  notifications, toast et timeout de session) vivent dans
  `src/app/[locale]/providers.tsx`.
- `src/lib` porte la logique serveur et les intégrations (Prisma, auth/RBAC,
  IA, email, facturation, stockage). Préserver la séparation entre composants,
  Route Handlers, services métier et accès Prisma ; les composants client ne
  doivent pas accéder directement à la base.
- Le produit est multi-tenant. Toute lecture ou mutation métier doit être
  bornée au `tenantId`, passer l'authentification Clerk et le contrôle RBAC
  côté serveur, puis produire la traçabilité appropriée.
- Le dossier est l'agrégat métier central. Les canaux alimentent des
  `InformationUnit` dédupliquées et leur machine à états, avec `EventLog`/
  journaux d'audit chaînés. Une proposition IA incertaine exige une validation
  humaine ; elle ne doit jamais déclencher une mutation irréversible.

## Conventions de code

- Conserver l'App Router et les imports absolus `@/…`. Privilégier les Server
  Components ; ajouter `'use client'` uniquement pour les hooks, événements ou
  APIs navigateur. Réutiliser les providers, stores Zustand et React Query
  existants avant d'ajouter une couche d'état ou une dépendance.
- Le projet est en TypeScript strict : préférer des types explicites et des
  gardes de nullité à `any`. Éviter les ternaires imbriqués ; garder les
  composants lourds en chargement différé lorsque le pattern existe déjà.
- Centraliser la validation des entrées structurées dans les schémas Zod de
  `src/lib/validation/schemas.ts` ou dans un schéma local cohérent. Les Route
  Handlers ne reçoivent pas directement une entrée libre : adapter/parsing,
  brouillon structuré, validation humaine, puis appel métier.
- Protéger chaque route sensible avec la session Clerk et la permission RBAC
  adaptée. Renvoyer des erreurs HTTP précises sans pile d'appel. Les webhooks
  doivent vérifier leur signature, être idempotents et dédupliquer leur
  `messageId` ou checksum ; appliquer le rate limiting Upstash aux endpoints
  sensibles.
- Les modèles Prisma requièrent des relations avec `onDelete` explicite, des
  contraintes d'unicité et index correspondant aux requêtes, ainsi que
  `createdAt`/`updatedAt` lorsque le modèle est mutable. Grouper les mutations
  métier liées dans une transaction et enregistrer l'audit immutable requis.
- Ne jamais journaliser de données personnelles, de contenu de dossier ou de
  secrets. Les données sensibles doivent suivre les mécanismes de chiffrement,
  anonymisation, rétention et droit à l'oubli déjà présents.
- Suivre Prettier (`npm run format:check`) et les conventions Conventional
  Commits (`feat:`, `fix:`, `docs:`, `test:`, etc.).

## Revue de code

- Répondre en français, avec un ton professionnel et constructif.
- Examiner spécifiquement les régressions RGPD, les credentials codés en dur,
  les headers de sécurité (CSP/HSTS), l'authentification et les permissions des
  routes API.
- Vérifier les dépendances de `useEffect`, le chargement des composants lourds
  et les cas limites de la logique métier, notamment les échéances et les
  décisions assistées par IA.
