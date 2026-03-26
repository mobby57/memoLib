# GO/NO-GO GAFAM - MemoLib (1 page)

Date: 2026-03-26
Portee: evaluation rapide de la capacite de livraison fiable (MVP -> V1)
Mode: evidence documentaire + pipelines + checklists existantes

## Verdict

NO-GO conditionnel pour une livraison large.

GO possible pour une livraison controlee (beta/ciblee) apres fermeture des bloqueurs P0/P1 ci-dessous.

## Score global (0-100)

- Score actuel estime: 82/100
- Seuil recommande pour GO production large: >= 90
- Regle bloquante: tout P0 ouvert = NO-GO

## Gate 10 points (style GAFAM)

1. Scope produit et non-objectifs explicites - 8/10

   - Preuves: docs/MVP_ROADMAP.md
   - Point d'attention: plusieurs checklists heterogenes, risque de derive de perimetre.

1. Decoupage en increments deployables - 8/10

   - Preuves: docs/MVP_ROADMAP.md, ACTION_PLAN_*.md
   - Point d'attention: certains lots melangent produit, infra et marketing.

1. Quality gates CI automatiques - 9/10

   - Preuves: .github/workflows/ci-cd.yml
   - Forces: lint, type-check, tests, build, security scan, quality gate final.

1. Securite supply-chain et code scanning - 9/10

   - Preuves: .github/workflows/codeql.yml, .github/workflows/snyk.yml, .github/workflows/trivy.yml, .github/workflows/trufflehog.yml
   - Point d'attention: verifier blocage effectif sur PR via branch protection.

1. AuthN/AuthZ et durcissement API - 8/10

   - Preuves: SECURITY_API_HARDENING_CHECKLIST.md
   - Point d'attention: routes test/dev encore presentes, a verrouiller strictement en prod.

1. RGPD et minimisation des donnees - 7/10

   - Preuves: docs/CONFORMITE_RGPD_CHECKLIST.md
   - Bloqueur: purge automatique et procedures d'archivage/suppression a terminer.

1. Donnees et migrations (Prisma/DB) - 7/10

   - Preuves: ci-cd migration deploy en prod, roadmap schema/migrations
   - Point d'attention: formaliser tests de rollback DB et verification indexes avant release.

1. Observabilite et SLO/alerting - 7/10

   - Preuves: checklists de monitoring/deploiement
   - Bloqueur: SLO chiffrés, dashboards et alertes d'exploitation a rendre obligatoires par environnement.

1. Strategie de rollout + rollback - 8/10

   - Preuves: production/deployment checklists
   - Point d'attention: canary/feature flags pas explicitement imposes dans le gate.

1. Exploitabilite (runbooks, ownership, astreinte) - 9/10

   - Preuves: documentation abondante, plans d'action, checklists
   - Point d'attention: eviter doublons contradictoires entre documents.

## Bloqueurs a fermer avant GO large

P0 (must-have)

- Branch protection: imposer le statut unique `Quality Gate` en required check sur la branche principale.
- Verifier que toutes les routes sensibles exigent session + role + tenant scope en prod.
- Verifier secrets obligatoires en production (webhooks, cron, auth) sans fallback dev.

P1 (fortement recommande)

- Implementer la purge RGPD automatique + runbook de retention/archivage.
- Definir 3 a 5 SLO (latence API, erreurs 5xx, disponibilite, delais de traitement) + alertes.
- Ajouter un vrai gate de rollback teste (DB + app) sur un environnement de preprod.

## Plan 7 jours pour passer a GO

J1-J2

- Activer/valider branch protection + checks requis.
- Audit automatique des routes API test/dev exposees.

J3-J4

- Finaliser purge RGPD + tests + documentation de preuve.
- Stabiliser politique de secrets (inventaire, rotation, controle en CI).

J5-J6

- Mettre en place dashboard SLO + alertes critiques.
- Exercices de rollback applicatif + base de donnees.

J7

- Revue Go/No-Go finale avec score.
- GO si score >= 90 et zero P0.

## Sources principales

- .github/workflows/ci-cd.yml
- .github/workflows/codeql.yml
- .github/workflows/snyk.yml
- .github/workflows/trivy.yml
- .github/workflows/trufflehog.yml
- docs/MVP_ROADMAP.md
- docs/CONFORMITE_RGPD_CHECKLIST.md
- SECURITY_API_HARDENING_CHECKLIST.md
- PRODUCTION_CHECKLIST.md
- .github/AUDIT_CI_CHECKLIST_SCORE.md
