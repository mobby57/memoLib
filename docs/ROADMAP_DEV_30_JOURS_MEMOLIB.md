# Roadmap dev 30 jours MemoLib

Date: 2026-04-03

Objectif:
- Livrer un pipeline complet et vendable en 30 jours.

## Semaine 1 (J1-J5) - Starter inbox + validation

J1:
- Stabiliser les endpoints inbox/pending-actions.
- Normaliser les payloads request/response.

J2:
- Finaliser UI inbox intelligente (filtre, tri, urgence, source).
- Ajouter actions approve/reject unitaires.

J3:
- Ajouter actions bulk (approve/reject) + feedback utilisateur.
- Ajouter trace minimale des decisions.

J4:
- Ecrire tests API (cas nominal + acces refuse + erreurs).
- Ecrire tests UI critiques.

J5:
- Revue de sprint et correction bugs blocants.
- Preparation demo interne v1.

Livrable semaine 1:
- Inbox et validation manuelle fiables.

## Semaine 2 (J6-J10) - IA utile et controlee

J6:
- Integrer adaptateur Semantic Kernel (health + analyze).
- Garder fallback local si indisponible.

J7:
- Mapper resultat IA -> categorie, urgence, suggestions.
- Afficher score de confiance dans UI.

J8:
- Ajouter bouton "appliquer suggestion" et "corriger suggestion".
- Capturer feedback humain pour amelioration.

J9:
- Ajouter garde-fous prompts + redaction PII.
- Journaliser les appels IA (cout, latence, modele).

J10:
- Tests d'acceptation IA (precision min, latence max).
- Demo "email -> suggestion -> validation".

Livrable semaine 2:
- IA branchee sans perte de controle humain.

## Semaine 3 (J11-J15) - Workflow metier explicite

J11:
- Definir state machine pipeline (RECEIVED -> CLOSED).
- Ajouter entites transitions et execution.

J12:
- Integrer Elsa pour orchestration des etats.
- Ajouter retries et dead-letter.

J13:
- Ajouter SLA timers (ex: non valide sous X heures).
- Ajouter alertes et priorisation.

J14:
- Ajouter ecran timeline workflow par dossier.
- Ajouter trace de decision par transition.

J15:
- Tests workflow bout en bout.
- Demo "pipeline complet".

Livrable semaine 3:
- Workflow auditable et operationnel.

## Semaine 4 (J16-J20) - Recherche et observabilite

J16:
- Brancher indexation recherche (Elasticsearch ou Meilisearch).
- Definir mapping index des objets clefs.

J17:
- Ajouter endpoint recherche transverse.
- Ajouter UI de recherche (filtres, highlights).

J18:
- Structurer logs (Serilog) + correlation id.
- Ajouter dashboard observabilite (erreurs, latence, SLA).

J19:
- Durcir auth/roles/scopes (OpenIddict cible).
- Valider droits d'acces multi-tenant.

J20:
- Revue securite + RGPD (checklist de release).

Livrable semaine 4:
- Search + logs + securite de base en place.

## Semaine 5 (J21-J25) - Packaging business

J21:
- Ajouter plans et quotas (starter/cabinet/enterprise).

J22:
- Dashboard business (activation, retention, usage IA).

J23:
- Flot demo commercial guide (scriptable).

J24:
- KPI instrumentation funnel conversion.

J25:
- Repetition demo complete (produit + securite + ROI).

Livrable semaine 5:
- Produit presentable et vendable.

## Semaine 6 (J26-J30) - Hardening go-live

J26:
- Bug bash + resolution P0/P1.

J27:
- Tests E2E Playwright + tests .NET critiques.

J28:
- Validation performance (latence API, index, UI).

J29:
- Freeze release + runbook incident.

J30:
- Go/No-Go + lancement pilote.

Livrable final:
- Version pilote production-ready.

## KPI cibles

- Taux de classification utile >= 80%
- Temps moyen "email -> decision" <= 3 minutes
- Taux erreur pipeline < 2%
- Disponibilite API >= 99.5%
- Conversion demo -> essai >= 25%
