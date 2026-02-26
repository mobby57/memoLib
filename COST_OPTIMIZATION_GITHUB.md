# Optimisation des coûts GitHub

Ce guide pratique vise à réduire vos dépenses GitHub (Actions, Codespaces, Copilot, stockage). Il s’appuie sur des changements déjà appliqués dans `.github/workflows` et des actions côté organisation.

## 1) Actions (minutes + stockage)

- Concurrency: Annule les exécutions en cours sur la même branche/tâche. Déjà ajouté dans: `ci-optimized.yml`, `deploy-optimized.yml`, `deploy-multi.yml`, `release.yml`.
- Timeouts: Limite la durée des jobs pour éviter les minutes inutiles.
- Filtres `paths`: Évite les runs si les fichiers non pertinents changent (README, docs). Déjà ajouté dans le CI.
- Cache: Utilisez `actions/setup-node` avec `cache: 'npm'` (déjà présent) + privilégiez `npm ci`.
- Artefacts: Éviter l’upload d’artefacts volumineux; si nécessaire, spécifier `retention-days: 1-3` sur `actions/upload-artifact`.
- Matrices: Réduire la taille des matrices et/ou `fail-fast: true`.
- Schedules: Éviter les cron trop fréquents, ou les restreindre aux heures creuses.
- Self-hosted runners: Pour jobs lourds, un runner auto-hébergé peut réduire le coût à grande échelle.

## 2) Codespaces

- Machine: Choisir des configurations plus petites (2-4 vCPU) pour la majorité des devs.
- Idle timeout: Réduire à 30-60 min; auto-stop agressif.
- Policy: Restreindre la création de Codespaces hors projets critiques; exiger approbations pour tailles XL.
- Prébuilds: Activer seulement pour branches à fort trafic (main, release), sinon désactiver.

## 3) Copilot

- Sièges: Auditer les utilisateurs actifs; retirer les sièges inactifs.
- Politiques: Restreindre aux équipes/projets stratégiques; revoir mensuellement.
- Rapports: Utiliser les rapports d’adoption pour identifier comptes peu actifs.

## 4) Stockage (Artifacts, Packages, LFS)

- Artifacts: Nettoyer régulièrement; définir `retention-days` faible.
- GitHub Packages: Supprimer images/paquets obsolètes (npm, docker). Valider règles de rétention.
- LFS: Migrer ou purger fichiers volumineux inutiles; éviter commits lourds.

## 5) Déclencheurs & Portée

- Branches: Limiter les `push` builds aux branches principales (main/develop) + PRs.
- Paths: Restreindre aux dossiers applicatifs (`src/**`, `package.json`, lockfiles).
- Draft PR: Éviter les CI lourds sur PR brouillons (déjà ajouté).

## 6) Suivi & Gouvernance

- Budgets/Alertes: Configurer alertes de dépassement (Billing), surveiller les minutes mensuelles.
- Etiquetage: Loguer un résumé via `$GITHUB_STEP_SUMMARY` pour visibilité.
- Documentation interne: Ajoutez ce guide à votre handbook, imposez des revues des workflows.

## 7) Check-list rapide d’application

- [ ] Concurrency + `cancel-in-progress`
- [ ] `timeout-minutes` sur jobs
- [ ] `paths` / `paths-ignore` pertinents
- [ ] `cache` activé
- [ ] `retention-days` sur artefacts
- [ ] Matrices réduites
- [ ] Codespaces tailles/idle contrôlés
- [ ] Copilot sièges optimisés
- [ ] Packages/LFS nettoyés

## 8) Prochaines étapes proposées

- Ajouter `paths-ignore` pour docs globalement (`README.md`, `DOCS.md`, `docs/**`).
- Si vous utilisez `upload-artifact`, passer en `retention-days: 3`.
- Limiter les triggers sur `feat/**` (déjà retiré du CI).
- Partager accès org pour un audit automatisé (Codespaces/Copilot/Packages).
