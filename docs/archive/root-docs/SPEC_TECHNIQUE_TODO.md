# SPEC TECHNIQUE TODO - MEMOLIB

Date: 2026-04-03
Version: 1.0
Statut: Draft executable

## 1) Objectif

Ce document definit une specification technique complete orientee execution pour:

- stabiliser la qualite logicielle
- fiabiliser la securite et la conformite
- corriger la chaine .NET API
- industrialiser un scheduler de traitements metier
- preparer la mise en production avec observabilite

## 2) Perimetre

Inclus:

- Frontend Next.js/TypeScript
- Scripts PowerShell de qualite et securite
- API .NET (`MemoLib.Api`)
- Pipeline validation locale pre-merge
- Monitoring, health checks et runbooks

Exclus (phase ulterieure):

- refonte UI complete
- migration infra majeure
- optimisation cout cloud avancee

## 3) Etat actuel (synthetique)

- Type-check TypeScript: vert apres correctifs recents.
- Tests integration: verts.
- Scan secrets sur fichiers modifies: en place et valide.
- PR securite ouverte sur branche basee sur `main` (workflow corrige).
- Point bloquant majeur restant: execution/build .NET (`dotnet run`) non stable selon scope projet.

## 4) Architecture cible (court terme)

### 4.1 API et workers

- API .NET expose endpoints metier et administration.
- Worker planifie (hosted service) execute jobs en arriere-plan.
- Table de lease/lock pour eviter les executions concurrentes non desirees.

### 4.2 Scheduler metier

Composants cibles:

- `JobSchedule`: configuration de periodicite, fenetre, quota.
- `JobExecution`: traces d'execution, statut, duree, tentative.
- `DeadLetter`: echec final avec motif et action de reprise.

### 4.3 Observabilite

- Health checks techniques (`/health`, `/ready`).
- Logs structures (correlation id, tenant id, job id).
- Metriques minimales: succes, echec, latence, retries.

## 5) Exigences non fonctionnelles

- Disponibilite cible API: >= 99.5%.
- Tolerance erreur scheduler: reprise automatique avec retry exponentiel + jitter.
- Securite: zero secret hardcode dans code/scripts/docs.
- Traçabilite: chaque job doit etre audit-able de bout en bout.
- Qualite: gates obligatoires avant merge (`type-check`, tests integration, scan secrets changed).

## 6) Backlog technique TODO (priorise)

Format:

- ID: identifiant unique
- Priorite: P0 critique, P1 important, P2 optimisation
- Estimation: effort relatif
- Done si: criteres de validation concrets

### EPIC A - Stabilite build et structure .NET

- [x] A-001 - Cartographier la compilation `MemoLib.Api` (diagnostic documente)
  - Priorite: P0
  - Estimation: 2 pts
  - Todo:
    - inventorier fichiers inclus via `MemoLib.Api.csproj`
    - detecter doublons de classes/espaces de noms
    - lister references cassantes par dossier
  - Done si:
    - rapport de cartographie produit
    - liste d'actions de correction validee

- [x] A-002 - Normaliser le scope de build .NET (scope verrouille, build vert)
  - Priorite: P0
  - Estimation: 3 pts
  - Todo:
    - exclure les sources non destinees au projet API
    - corriger include/exclude dans le `.csproj`
    - verifier `dotnet build` au niveau repo et projet
  - Done si:
    - `dotnet build` passe 2 fois consecutives

- [x] A-003 - Retablir l'execution locale API (OK avec prerequis JWT)
  - Priorite: P0
  - Estimation: 2 pts
  - Todo:
    - corriger les erreurs de resolution namespace
    - valider `dotnet run` depuis `MemoLib.Api`
    - documenter commande de demarrage canonique
  - Done si:
    - API demarre sans erreur sur machine dev standard

### EPIC B - Securite operationnelle

- [ ] B-001 - Generaliser la politique anti-secrets
  - Priorite: P0
  - Estimation: 2 pts
  - Todo:
    - conserver scan changed-files comme gate principal
    - ajouter scan complet planifie (nightly/manuel)
    - verifier `.gitignore` pour extensions sensibles
  - Done si:
    - aucun secret detecte sur scan changed
    - procedure documentee dans `SECURITY.md`

- [ ] B-002 - Durcir scripts demo
  - Priorite: P1
  - Estimation: 2 pts
  - Todo:
    - imposer variables d'environnement pour credentials
    - ajouter guard explicite si variable manquante
    - ajouter exemple `.env.example` sans secrets reels
  - Done si:
    - aucun fallback credential hardcode

- [ ] B-003 - Triage vulnerabilites npm
  - Priorite: P1
  - Estimation: 3 pts
  - Todo:
    - classer vuln high/critical par impact runtime
    - corriger via upgrades compatibles
    - valider non-regression build/tests
  - Done si:
    - zero critical
    - high documentees ou corrigees

### EPIC C - Scheduler metier fiable

- [ ] C-001 - Modeles de donnees scheduler
  - Priorite: P1
  - Estimation: 5 pts
  - Todo:
    - creer tables `JobSchedule`, `JobExecution`, `DeadLetter`
    - definir index sur statut/date/prochaine execution
    - ajouter migration et rollback
  - Done si:
    - migration appliquee et testee sur environnement local

- [ ] C-002 - Worker de planification et execution
  - Priorite: P1
  - Estimation: 8 pts
  - Todo:
    - implementer boucle scheduler (tick court)
    - reserver un job via lease atomique
    - executer avec timeout configurable
  - Done si:
    - jobs executes sans doublon dans test multi-run

- [ ] C-003 - Retry, backoff, dead-letter
  - Priorite: P1
  - Estimation: 5 pts
  - Todo:
    - retry exponentiel + jitter
    - seuil max tentatives
    - bascule automatique en dead-letter
  - Done si:
    - scenario echec repetitif correctement dead-lettered

- [ ] C-004 - Replay et outils operateurs
  - Priorite: P2
  - Estimation: 3 pts
  - Todo:
    - endpoint de replay securise
    - filtre par cause et intervalle
    - audit trail du replay
  - Done si:
    - replay trace et reversible

### EPIC D - Observabilite et production readiness

- [ ] D-001 - Telemetrie minimale unifiee
  - Priorite: P1
  - Estimation: 3 pts
  - Todo:
    - correlation id traverse API -> worker
    - logs structures sur executions jobs
    - metriques succes/echec/latence
  - Done si:
    - dashboard de base exploitable en recette

- [ ] D-002 - Health checks fonctionnels
  - Priorite: P1
  - Estimation: 2 pts
  - Todo:
    - separer readiness/liveness
    - inclure dependances critiques (DB, queue interne)
    - ajouter checks scheduler
  - Done si:
    - endpoints health exploitables par supervision

- [ ] D-003 - Runbook incident
  - Priorite: P2
  - Estimation: 2 pts
  - Todo:
    - procedure indisponibilite API
    - procedure explosion dead-letter
    - procedure rotation credentials
  - Done si:
    - exercice de simulation effectue

### EPIC E - Qualite et gates pre-merge

- [ ] E-001 - Pipeline local canonique
  - Priorite: P0
  - Estimation: 2 pts
  - Todo:
    - sequence standard: type-check -> tests integration -> scan changed
    - verifier hook pre-commit et scripts associes
    - ajouter section "quick start dev" unique
  - Done si:
    - tout contributeur peut executer le meme flux en 1 commande

- [ ] E-002 - Couverture tests modules critiques
  - Priorite: P1
  - Estimation: 5 pts
  - Todo:
    - cibler auth, middleware, ingestion, scheduler
    - ajouter tests de non-regression sur erreurs API
    - publier seuil minimum coverage
  - Done si:
    - couverture >= 70% sur modules critiques

## 7) Planning propose (4 sprints)

Sprint 1 (P0):

- A-001, A-002, A-003
- E-001
- B-001

Sprint 2 (P1):

- B-003
- C-001
- C-002

Sprint 3 (P1/P2):

- C-003
- D-001
- D-002

Sprint 4 (hardening):

- C-004
- D-003
- E-002
- B-002

## 8) Definition of Ready / Done

Definition of Ready:

- besoin metier explicite
- impact securite identifie
- cas de test nommes
- dependances connues

Definition of Done:

- code merge
- gates qualite vertes
- doc technique mise a jour
- observabilite verifiee (logs + health)

## 9) Commandes de validation (reference)

Qualite JS/TS:

- `npm run type-check`
- `npm run test:integration`
- `npm run security:scan:changed`

API .NET:

- `dotnet build` (racine projet API)
- `dotnet run --project MemoLib.Api.csproj` (depuis la racine)
- prerequis local: definir `JwtSettings__Issuer`, `JwtSettings__Audience`, `JwtSettings__SecretKey`

## 10) Risques et mitigations

- Risque: corrections .NET impactent des modules annexes.
  - Mitigation: cartographie A-001 avant tout refactor de scope.

- Risque: upgrades dependances introduisent des regressions.
  - Mitigation: corriger par lots, valider gates a chaque lot.

- Risque: scheduler cree charge DB excessive.
  - Mitigation: indexation des tables scheduler + batch size limite.

## 11) Livrables attendus

- spec technique validee (ce document)
- backlog converti en issues (ID A/B/C/D/E)
- API .NET relancable localement
- scheduler MVP operationnel
- dashboard minimal d'observabilite
