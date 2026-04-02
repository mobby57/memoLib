# Plan Sprint detaille avec owners

Date: 2026-04-02
Hypothese capacite: 21 points par sprint

## Owners proposes
- Owner API: Lead Backend
- Owner UI: Lead Frontend
- Owner Sec: Security Engineer
- Owner QA: QA Engineer
- Owner Ops: DevOps Engineer
- Owner Legal: Product Legal

## Sprint 1 - Stabilite et securite (16 pts)
Objectif: fiabiliser les flux critiques et verrouiller la qualite.

### Scope
- BL-001 (3 pts) - Owner UI + QA
- BL-002 (5 pts) - Owner API + QA
- BL-003 (3 pts) - Owner Ops + QA
- BL-004 (5 pts) - Owner Sec + Owner Ops

### Deliverables
- parcours email stable
- format d'erreur API standard
- gates CI obligatoires
- hygiene secrets renforcee

### Risques
- dette technique existante dans endpoints historiques
- dispersion de secrets dans scripts annexes

### Mitigation
- test contract first sur endpoints sensibles
- audit secrets automatise en CI

## Sprint 2 - Fiabilite ingestion et tri (21 pts)
Objectif: robustesse de l'ingestion et lisibilite du tri.

### Scope
- BL-005 (8 pts) - Owner API + QA
- BL-006 (5 pts) - Owner UI + Owner Ops
- BL-007 (8 pts) - Owner Legal + Owner API + QA

### Deliverables
- idempotence ingestion
- dashboard ingestion exploitable
- score de confiance explique

### Risques
- precision du classement insuffisante au debut
- perf degradee si instrumentation trop lourde

### Mitigation
- rollout progressif du scoring
- instrumentation ciblee sur chemins critiques

## Sprint 3 - UX avocat et productivite (18 pts)
Objectif: reduire le temps de traitement des emails.

### Scope
- BL-008 (8 pts) - Owner UI + Owner Legal
- BL-009 (5 pts) - Owner UI + Owner API
- BL-010 (5 pts) - Owner API + Owner UI

### Deliverables
- inbox priorisee
- actions rapides en un clic
- historique dossier unifie

### Risques
- surcharge interface si trop d'actions visibles
- incoherence de timeline si model incomplet

### Mitigation
- tests utilisateurs rapides
- normalisation du model d'evenements

## Sprint 4 - Observabilite et operations (8 pts)
Objectif: rendre le systeme pilotable en production.

### Scope
- BL-011 (5 pts) - Owner Ops + Owner API
- BL-012 (3 pts) - Owner Ops + Owner Sec + QA

### Deliverables
- SLO/alerting actif
- playbook incident teste

### Risques
- alert fatigue
- runbook non adopte

### Mitigation
- seuils pragmatiques et revues hebdo
- exercice incident mensuel

## Rituels recommandes
- planning sprint: 60 min
- daily: 15 min
- refinement: 45 min / semaine
- demo: 45 min
- retro: 45 min

## KPIs de pilotage
- lead time ticket
- taux echec deploy
- taux ingestion sans reprise manuelle
- precision classification
- temps moyen traitement avocat
