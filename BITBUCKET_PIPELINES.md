# Bitbucket Pipelines - Configuration minimale

Ce repository contient plusieurs sous-projets (Python + Node). Le fichier `bitbucket-pipelines.yml` est volontairement **tolérant** et détecte automatiquement les composants présents.

## Déclencheurs

- Pull Requests (`**`)
- Branche `main`

## Étapes exécutées

1. **Backend Python checks**
   - Installation dépendances depuis :
     - `requirements-python.txt` (priorité)
     - `requirements.txt`
     - `backend-python/requirements.txt`
   - Exécution `pytest` si des tests Python sont détectés.

2. **Frontend/Node checks**
   - Détection automatique de `package.json` :
     - racine
     - `src/frontend`
     - `frontend-node`
   - Exécute, si disponibles :
     - `npm run lint`
     - `npm run type-check`
     - `npm run test`
     - `npm run build`

3. **Audit CI score gate (bloquant)**
   - Script: `scripts/ci/audit-score.sh`
   - Produit un rapport: `audit-ci-report.md` (artifact)
   - Échec automatique si:
     - au moins 1 finding **P0**, ou
     - score global `< AUDIT_MIN_SCORE`

## Scoring (P0/P1/P2)

- **P0 (bloquant immédiat)**: -25 points par finding
  - auth module manquant alors que des imports existent
  - credentials hardcodés backend
- **P1 (majeur)**: -10 points
  - URL localhost codées en dur dans API routes
  - absence de validation Zod sur API v1 (contrôle basique)
- **P2 (mineur)**: -5 points
  - `strict: false` dans TypeScript
  - incohérence potentielle setup Jest ESM/CJS

## Variables Bitbucket recommandées

- `AUDIT_MIN_SCORE` (ex: `85`)

## Recommandation (durcir la CI)

Quand la structure est stabilisée, remplacez les scripts conditionnels par des commandes strictes pour rendre la CI bloquante sur le projet cible uniquement.
