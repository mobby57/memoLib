# Vulnérabilités npm — correctifs à changement majeur (suivi)

**Date :** 2026-10-06
**Statut :** Correctifs sûrs appliqués ; correctifs cassants documentés ci-dessous (non appliqués).

## Contexte

`npm audit` signalait **66 vulnérabilités** (33 high, 31 moderate, 2 low).
`npm audit fix` (sans `--force`) a appliqué uniquement les correctifs
non-cassants, ramenant le total à **59** (29 high, 29 moderate, 1 low). Seul
`package-lock.json` a été modifié — `package.json` est inchangé, donc aucune
contrainte de version directe n'a bougé.

Gates vérifiés verts après correction : `type-check` (0 erreur),
`test:ci` (266 fichiers / 4870 tests), `build` production.

Les **59 vulnérabilités restantes** exigent toutes des upgrades/downgrades
majeurs. `npm audit fix --force` les « corrigerait » en **rétrogradant** des
dépendances critiques (p. ex. Next 15→downgrade, semantic-release vers v5/6/7),
ce qui casserait l'application. Elles sont donc traitées comme des chantiers
dédiés ci-dessous.

## Chantiers (regroupés par cible de correctif)

### 1. Chaîne `semantic-release` (high) — chantier le plus lourd

Paquets : `semantic-release`, `@semantic-release/npm`, `@semantic-release/github`,
`@semantic-release/changelog`, `@semantic-release/commit-analyzer`,
`@semantic-release/release-notes-generator`, + transitifs `npm`/`@npmcli/*`/
`pacote`/`sigstore`/`libnpm*`/`braces`/`micromatch`.

- `npm audit fix --force` propose un **downgrade** (p. ex. `@semantic-release/npm@7`)
  qui régresserait la chaîne de release. **Ne pas faire.**
- **Action correcte :** mettre à jour vers les dernières majeures de
  `semantic-release` et de ses plugins ensemble, puis vérifier le workflow de
  release en CI.
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

### 4. `jest` / `@jest/core` (moderate)

- Correctif annoncé : `jest@25` / `@jest/core@25` = **downgrade** absurde.
- **Action :** résolue par la migration Jest→Vitest déjà documentée
  (`docs/ADR/0002-test-runner-vitest-primary.md`). Retirer Jest supprime ces
  advisories sans downgrade.

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

1. **Jest→Vitest** (chantier #4) — supprime plusieurs advisories sans risque de
   downgrade, déjà documenté (ADR-0002).
2. **semantic-release** (chantier #1) — plus grand nombre de high ; upgrade (pas
   downgrade) + validation CI release.
3. **Next 16** (chantier #2) puis **Tailwind v4** (chantier #3) — migrations
   majeures à planifier avec tests de non-régression.

> ⚠️ Ne jamais lancer `npm audit fix --force` sur ce dépôt : il rétrograderait
> Next, Tailwind et semantic-release et casserait l'application.
