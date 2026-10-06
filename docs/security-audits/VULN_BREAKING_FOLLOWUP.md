# Vulnérabilités npm — correctifs à changement majeur (suivi)

**Date :** 2026-10-06
**Statut :** Correctifs sûrs appliqués ; Jest→Vitest terminé ; semantic-release
évalué (laissé tel quel). Reste **42** vulnérabilités, toutes à changement
majeur ou tooling-only.

## Contexte

`npm audit` signalait initialement **66 vulnérabilités** (33 high, 31 moderate,
2 low).

Progression :

1. `npm audit fix` (sans `--force`) → **59** (correctifs non-cassants, lockfile
   seul ; `package.json` inchangé).
2. Migration Jest→Vitest + retrait des deps Jest → **42** (17 advisories
   éliminées sans downgrade).

Gates vérifiés verts à chaque étape : `lint`, `type-check` (0 erreur),
`test:ci` (266 fichiers / 4870 tests), `build` production, `prisma validate`.

Les **42 vulnérabilités restantes** exigent toutes des upgrades/downgrades
majeurs ou concernent du **tooling CI uniquement** (pas de surface runtime).
`npm audit fix --force` les « corrigerait » en **rétrogradant** des dépendances
critiques (Next, Tailwind, semantic-release), ce qui casserait l'application.
Elles sont donc traitées comme des chantiers dédiés ci-dessous.

## Chantiers (regroupés par cible de correctif)

### 1. Chaîne `semantic-release` (high) — chantier le plus lourd

Paquets : `semantic-release`, `@semantic-release/npm`, `@semantic-release/github`,
`@semantic-release/changelog`, `@semantic-release/commit-analyzer`,
`@semantic-release/release-notes-generator`, + transitifs `npm`/`@npmcli/*`/
`pacote`/`sigstore`/`libnpm*`/`braces`/`micromatch`.

> **Revue de risque (2026-10-06) — conclusion : NE PAS migrer/downgrader.**
>
> Faits vérifiés :
>
> - Les versions installées sont **déjà les dernières majeures** :
>   `semantic-release@24`, `@semantic-release/npm@12`, `/github@11`,
>   `/commit-analyzer@13`, `/release-notes-generator@14`, `/changelog@6`,
>   `/git@10`. Il n'y a aucune montée de version à faire.
> - Les ~20 advisories high de cette chaîne proviennent **toutes** de
>   `node_modules/npm/node_modules/*` : `@semantic-release/npm` embarque un
>   **CLI `npm` vendorisé** dont les sous-dépendances figées sont anciennes
>   (`@npmcli/arborist`, `pacote`, `libnpm*`, `brace-expansion`,
>   `http-cache-semantics`, `ip-address`).
> - `semantic-release` est une **devDependency** exécutée **uniquement en CI
>   pendant la release**, jamais incluse dans le bundle de production
>   (`next build`). Surface d'attaque runtime = **0**.
> - `npm audit fix --force` proposerait un **downgrade** (p. ex.
>   `@semantic-release/npm@7`) qui régresserait la chaîne de release pour
>   « corriger » des vulns qui ne touchent pas le runtime. **À proscrire.**
>
> **Décision :** laisser semantic-release tel quel. Le vrai correctif viendra
> **en amont** quand `@semantic-release/npm` mettra à jour son npm vendorisé —
> à surveiller, pas à forcer. Une option à faible valeur et fragile serait des
> `overrides` npm sur les sous-deps vendorisées ; non recommandée sans exigence
> de conformité stricte.

- `@semantic-release/git` : **aucun correctif disponible** (`fix:NONE`) —
  surveiller l'advisory en amont.

### 2. `next` + `postcss` (moderate/high)

- Correctif annoncé : `next@16.3.8` (majeure 15→16).
- **Action :** upgrade Next.js 16 planifié séparément (migration + tests de
  non-régression complets). Lié au drift déjà corrigé dans la doc.

### 3. `tailwindcss` + `chokidar` (high)

- Correctif annoncé : `tailwindcss@4.3.3` (migration v3→v4, cassante :
  config, directives, plugins).
- **Action :** migration Tailwind v4 dédiée, avec revue visuelle.

### 4. `jest` / `@jest/core` (moderate) — ✅ RÉSOLU (2026-10-06)

- Correctif annoncé par l'audit : `jest@25` / `@jest/core@25` = **downgrade** absurde.
- **Statut : fait.** La migration Jest→Vitest est terminée (voir
  `docs/ADR/0002-test-runner-vitest-primary.md`). Jest et toutes ses
  dépendances ont été retirés, ce qui a **éliminé 17 advisories** (59 → 42)
  sans aucun downgrade.

### 5. Divers directs

- `exceljs` → `exceljs@3.4.0` (downgrade, lié à `uuid`) — évaluer upgrade vers
  une version non vulnérable plutôt que downgrade.
- `mammoth` → `mammoth@0.3.29` (downgrade, lié à `argparse`/`sprintf-js`).
- `@tailwindcss/typography` → `0.5.4` (downgrade, lié à
  `postcss-selector-parser`) — à traiter avec le chantier Tailwind.
- `eslint-config-next` → `14.2.35` (downgrade, lié à `fast-glob`) — à aligner
  avec l'upgrade Next.
- `esbuild` (low, transitif) — résiduel ; disparaîtra avec les upgrades amont.

## Recommandation de priorité

Priorisation par **impact/risque runtime**, pas par nombre brut de
vulnérabilités.

1. ✅ **Jest→Vitest** (chantier #4) — **FAIT.** 17 advisories éliminées sans
   downgrade (ADR-0002).
2. ✅ **semantic-release** (chantier #1) — **ÉVALUÉ, aucune action.** Versions
   déjà à jour ; advisories = npm vendorisé, tooling CI uniquement, surface
   runtime nulle. À surveiller en amont.
3. **Next 16** (chantier #2) — migration majeure, à planifier en session dédiée
   avec tests de non-régression complets + déploiement staging + observation.
4. **Tailwind v4** (chantier #3) — migration majeure, session dédiée après Next,
   avec revue visuelle. Inclut `@tailwindcss/typography`.
5. **Divers directs** (chantier #5) — `exceljs`, `mammoth`, `eslint-config-next`
   à traiter au fil des migrations amont (ne pas downgrader).

> ⚠️ Ne jamais lancer Next 16, Tailwind v4 et une autre migration majeure dans
> la même session. Chaque migration doit avoir son propre état avant/après.

> ⚠️ Ne jamais lancer `npm audit fix --force` sur ce dépôt : il rétrograderait
> Next, Tailwind et semantic-release et casserait l'application.
