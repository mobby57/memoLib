# Memolib

Plateforme moderne pour connecter des personnes en recherche d’aide juridique avec des avocats, de manière simple, traçable et responsable.

- Vision, limites et doctrine: voir [docs/vision.md](docs/vision.md), [docs/limits.md](docs/limits.md), [docs/doctrine.md](docs/doctrine.md).
- Démo UI: accueil, espace clients, espace avocat, admin.
- Tech: Next.js 16 (App Router), TypeScript, Tailwind v4, Playwright E2E, Stripe, Prisma.

## Démarrage
```bash
npm install
npm run dev
# ouvre http://localhost:3000
```

## Pages & parcours
- `/` Accueil (hero, bénéfices, CTAs)
- `/clients` Espace clients (étapes, stats, illustration)
- `/legal/avocat` Espace avocat (conformité, audit, modèles)
- `/billing` Paiements (démo)
- `/admin/dashboard` Tableau de bord admin
- `/admin/analytics` / `/admin/integrations`

## Scripts utiles
- `npm run typecheck:frontend` — vérification TypeScript
- `npm run lint` — lint
- `npm run build` — build production
- `npm run ci` — enchaîne typecheck + lint + build
- `npm run icons` — (re)génère les favicons depuis `public/logo-favicon.svg`

## Design système
- Palette marque teal/bleu (cohérente avec le logo).
- Composants: `Button` (primary/secondary/outline/ghost), `Card`, `SectionHeader`, `StatsGrid`, `Badge`.
- Fond décoratif doux via `.hero-pattern`.

## Qualité & sécurité
- TypeScript strict, tests E2E (Playwright), CI locale.
- Conception: RBAC, traçabilité, chiffrement; Stripe pour facturation.

## Roadmap (extrait)
- Phase 0: cadrage (vision, limites, doctrine) — DONE
- Phase 1: centralisation email, mémoire immuable, IA encadrée
- Phase 2: gouvernance des accès
- Phase 3: templates métiers
