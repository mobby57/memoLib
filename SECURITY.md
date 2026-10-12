# Politique de sécurité — MemoLib

**Dernière mise à jour :** 12 octobre 2026

## Signalements

Envoyez tout signalement à **security@memolib.space** ou via
GitHub Security Advisories (onglet Security → Report a vulnerability).

- Accusé de réception sous 72 h
- Évaluation sous 7 jours

## État des vulnérabilités — 12 octobre 2026

- **42 vulnérabilités npm** signalées par Dependabot
- **0 correctible** par `npm audit fix` sans breaking change
- **0 vulnérabilité dans le code applicatif (`src/`)**

## Répartition

| Source | Nombre | Environnement | Action |
|---|---|---|---|
| `npm` (bundled) | ~29 | Dev global | Attendre npm 12 |
| `semantic-release` | ~5 | Dev/CI only | Migrer vers release-please |
| `mammoth` → `sprintf-js` | 1 | Production | Attendre patch |
| `exceljs` → `uuid` | 1 | Production | Attendre patch |
| `postcss-nested` | 1 | Dev/build | Dev only |

## Évaluation du risque

| Critère | Statut |
|---|---|
| Runtime de production (Next.js) | Non affecté |
| Code applicatif (`src/`) | Non affecté |
| Utilisateurs finaux | Non affecté |
| Workflow release GitHub Actions | Affecté (environnement isolé) |
| Machine de dev locale | Affecté si compromis local |

## Vulnérabilités acceptées

### 1. npm — 29 high (bundled)

**Raison** : npm embarque `@sigstore/core`, `sigstore`, `libnpmpublish`,
`brace-expansion` dans ses dépendances internes. Ces versions sont
**bundled** et ne peuvent pas être mises à jour indépendamment.

**Impact** : aucun. Ces packages servent aux commandes `npm publish`
et `npm install`, pas au runtime de `memolib`.

**Plan** : `npm install -g npm@latest` dès qu'une version patchée est
publiée. Pas de migration nécessaire côté projet.

**Ticket** : à créer dans les issues GitHub.

### 2. semantic-release — 5 (dev only)

**Raison** : outil de release CI. Jamais exécuté en production.
Dépendance transitive : `semantic-release` → `npm` → `@sigstore/*`.

**Impact** : limité au workflow GitHub Actions `release.yml`
(environnement éphémère).

**Plan** : migrer vers `release-please` (Google) qui élimine cette chaîne.

**Échéance cible** : Q4 2026
**Responsable** : mobby57

### 3. mammoth → sprintf-js — 1 moderate

**Raison** : `sprintf-js` DoS via unbounded precision specifiers.
`mammoth` l'utilise pour parser les `.docx`.

**Impact** : un `.docx` malveillant pourrait causer un DoS.
Mitigé par validation en amont (taille max, type MIME).

**Plan** : mise à jour de `mammoth` dès qu'une version patchée existe.

### 4. exceljs → uuid — 1 moderate

**Raison** : `uuid < 11.1.1` missing buffer bounds check dans v3/v5/v6
quand `buf` est fourni.

**Impact** : limité. `buf` n'est jamais fourni par l'utilisateur
dans `memolib`.

**Plan** : mise à jour de `exceljs` dès qu'une version patchée existe.

## Ce que nous ne considérons PAS comme des vulnérabilités

- Alertes provenant de dépendances de **développement uniquement**
- Alertes provenant d'outils de **build ou release** jamais exécutés en prod
- Faux positifs Dependabot sur dépendances transitives non exécutées

## Procédure

### Trimestriel

    npm audit
    npm audit fix
    npm run test:ci

### À chaque alerte Dependabot high

1. Évaluer l'impact réel (exploitable en prod ?)
2. Si non → documenter ici
3. Si oui → patcher ou mitiger dans la semaine

### Interdiction

**Ne pas utiliser `npm audit fix --force`** sans plan de migration testé.
Le `--force` installe des versions majeures incompatibles (Next.js, React)
et casse la CI.

## Bonnes pratiques

- Les secrets ne sont **jamais** commités (voir `.gitignore`)
- Les workflows GitHub Actions utilisent des secrets chiffrés
- `npm audit` est exécuté avant chaque release majeure
- Tokens CSRF et cookies de session sont invalidés via rotation de `NEXTAUTH_SECRET`

## Historique

| Date | Action |
|---|---|
| 11/10/2026 | Ajout règles d'ignorance cookies/tokens (`cd85aef6`, `996c6fad`) |
| 11/10/2026 | Correction bug UTC dans `isFrenchHoliday` (`367d6116`) |
| 12/10/2026 | Documentation des 42 vulnérabilités npm acceptées |