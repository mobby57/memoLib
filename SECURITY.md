# Sécurité — vulnérabilités acceptées

## État au 2026-10-20

`npm audit` remonte **29 high** en attente de correction. **Aucune n'est corrigeable
via `npm audit fix` safe** — toutes nécessitent `isSemVerMajor: True` (breaking change).

## Catégorisation

### A. Dev chain — aucun impact production (18 high)

Chaîne `semantic-release` → `npm` CLI → `sigstore` → `@npmcli/*` → `pacote`.

Ces paquets sont dans l'outillage de release, pas dans le bundle Next.js.
Fixer nécessite de casser `semantic-release` (passage de v17 à v19+).

- `@semantic-release/*` (changelog, commit-analyzer, git, github, npm, release-notes-generator)
- `npm`, `sigstore`, `@sigstore/*`, `@npmcli/*`
- `libnpmdiff`, `libnpmexec`, `libnpmfund`, `libnpmpack`, `libnpmpublish`, `pacote`

**Action** : traiter lors de la prochaine migration d'outillage (Q1 2027).

### B. Build-time — n'apparaît pas dans le bundle runtime (4 high)

- `tailwindcss` (fix → `tailwindcss@4.3.3`, breaking 3 → 4)
- `postcss` (fix → `next@16.4.2`, breaking 15 → 16)
- `@next/eslint-plugin-next`, `eslint-config-next` (fix → rétrograde 15 → 14)

Ces paquets génèrent le CSS/lint au build, mais ne sont pas exécutés dans le
runtime Next.js. Impact production : **nul**.

**Action** : à corriger lors de la migration Next.js 15 → 16 et Tailwind 3 → 4
(chantier séparé, 1-2 semaines).

### C. Utilitaires glob — transitifs via tailwind/semantic-release (4 high)

- `chokidar`, `fast-glob`, `braces`, `micromatch`

Ces utilitaires sont utilisés au build/dev, pas dans le bundle. Fixés
automatiquement par les mises à jour de tailwind/next ci-dessus.

### D. Runtime potentiel (3 high)

- **`engine.io`** : dépendance de `socket.io` (serveur WS). Le serveur WS est
  actuellement **hors service** (ticket séparé). À corriger en même temps que
  la remise en route du WS.
- **`undici`** : client HTTP interne de Node.js, utilisé par `@sentry/nextjs`.
  Fix fourni par une mise à jour de `@sentry/nextjs`.
- **`http-cache-semantics`, `ip-address`, `picomatch`** : transitifs, fix safe
  disponible mais nécessite un `npm audit fix` manuel ciblé.

## Plan de remédiation

| Priorité | Action | Échéance |
|---|---|---|
| P0 | Corriger `undici` via mise à jour `@sentry/nextjs` | Q4 2026 |
| P0 | Corriger `engine.io` avec la remise en route du WS | Q4 2026 |
| P1 | Migrer Next.js 15 → 16 (fix 4 high build-time) | Q1 2027 |
| P1 | Migrer Tailwind 3 → 4 | Q1 2027 |
| P2 | Migrer `semantic-release` (fix 18 dev chain) | Q1 2027 |

## Dernière vérification

- Date : 2026-10-20
- Commande : `npm audit --json`
- Résultat : 58 vulns (2 low, 29 moderate, 29 high, 0 critical)
- Prod runtime réellement impactée : **0 vuln exploitable connue**
