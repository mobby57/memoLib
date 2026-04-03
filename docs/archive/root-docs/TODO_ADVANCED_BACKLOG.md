# Backlog Avance MemoLib

Date: 2026-04-02
Branche: chore/python-deps-2026

## Utilisation rapide (GitHub Projects)
- Colonnes recommandees: Backlog, Ready, In Progress, Blocked, In Review, Done.
- Labels recommandes: p0, p1, p2, security, email, ux, api, tests, infra, legal.
- Champs recommandes: Priority, Estimate, Risk, Owner, Sprint.

## Sprint 1 (P0) - Stabilite et securite

### BL-001 - Stabiliser le parcours email simulateur
- Priorite: P0
- Estimation: 3 pts
- Type: email, ux
- Description: valider le flux complet compose -> ingest -> confirmation.
- Taches:
  - verifier envoi depuis le simulateur
  - verifier scan manuel boite reelle
  - harmoniser messages d'erreur utilisateur
- Critere d'acceptation:
  - envoi OK
  - scan manuel retourne un statut lisible
  - aucune erreur JS en console sur le parcours principal
- Dependances: aucune

### BL-002 - Normaliser les erreurs API critiques
- Priorite: P0
- Estimation: 5 pts
- Type: api, tests
- Description: uniformiser le format de reponse erreur pour login, ingest, scan.
- Taches:
  - definir schema unique { error, message, details, code }
  - appliquer sur endpoints critiques
  - ajouter tests de contrat API
- Critere d'acceptation:
  - format stable sur 100% des endpoints critiques
  - tests de contrat passes
- Dependances: BL-001

### BL-003 - Verrouiller gates qualite pre-merge
- Priorite: P0
- Estimation: 3 pts
- Type: infra, tests
- Description: rendre obligatoires lint, typecheck et tests ciblant modules critiques.
- Taches:
  - configurer workflow CI
  - marquer checks requis
  - documenter commandes locales equivalentes
- Critere d'acceptation:
  - merge bloque si checks KO
  - doc developer mise a jour
- Dependances: aucune

### BL-004 - Hygiene secrets et conformite minimale
- Priorite: P0
- Estimation: 5 pts
- Type: security
- Description: verifier qu'aucun secret sensible n'est expose dans le repo et scripts.
- Taches:
  - audit des fichiers .md/.ps1/.js
  - suppression des secrets hardcodes
  - regles .gitignore et validation pre-commit
- Critere d'acceptation:
  - zero secret detecte sur scan
  - workflow documente
- Dependances: aucune

## Sprint 2 (P1) - Fiabilite ingestion et tri

### BL-005 - Idempotence ingestion email
- Priorite: P1
- Estimation: 8 pts
- Type: email, api
- Description: eviter les doublons d'evenements en cas de retry ou rescan.
- Taches:
  - definir cle d'idempotence
  - persistance de hash message
  - tests de resoumission
- Critere d'acceptation:
  - doubles soumissions n'ajoutent pas d'evenement duplique
- Dependances: BL-002

### BL-006 - Tableau de bord ingestion
- Priorite: P1
- Estimation: 5 pts
- Type: email, ux
- Description: exposer volume traite, erreurs, latence et succes.
- Taches:
  - endpoint stats ingestion
  - carte UI de suivi
  - alertes seuils critiques
- Critere d'acceptation:
  - stats visibles en moins de 2 clics
  - seuil d'alerte parametre
- Dependances: BL-005

### BL-007 - Score de confiance et justification
- Priorite: P1
- Estimation: 8 pts
- Type: legal, ux
- Description: afficher pourquoi un email est classe urgent/normal.
- Taches:
  - score + rationale
  - mapping mots-cles, dates, contexte
  - tests de regression classification
- Critere d'acceptation:
  - chaque classification affiche une explication
- Dependances: BL-002

## Sprint 3 (P1/P2) - UX avocat et productivite

### BL-008 - Inbox priorisee avocat
- Priorite: P1
- Estimation: 8 pts
- Type: ux, legal
- Description: trier par urgence legale et echeance.
- Taches:
  - tri multi-criteres
  - filtres urgents et dossiers lies
  - vue actions rapides
- Critere d'acceptation:
  - top des urgences visible instantanement
- Dependances: BL-007

### BL-009 - Actions rapides depuis email
- Priorite: P1
- Estimation: 5 pts
- Type: ux
- Description: creer dossier, demander pieces, planifier rappel en un clic.
- Taches:
  - boutons contextuels
  - templates de reponse pre-remplis
  - tracking action effectuee
- Critere d'acceptation:
  - reduction du temps moyen de traitement de 30%
- Dependances: BL-008

### BL-010 - Historique unifie par dossier
- Priorite: P2
- Estimation: 5 pts
- Type: ux, api
- Description: timeline complete emails + actions + statuts.
- Taches:
  - model timeline
  - endpoint lecture timeline
  - composant UI chronologique
- Critere d'acceptation:
  - historisation complete consultable par dossier
- Dependances: BL-009

## Sprint 4 (P1/P2) - Observabilite et operations

### BL-011 - SLO et monitoring service
- Priorite: P1
- Estimation: 5 pts
- Type: infra
- Description: definir et monitorer SLO de latence, erreur, succes ingestion.
- Taches:
  - definir objectifs
  - instrumenter API
  - configurer alertes
- Critere d'acceptation:
  - dashboard SLO actif
  - alertes sur derive
- Dependances: BL-006

### BL-012 - Playbook incident
- Priorite: P2
- Estimation: 3 pts
- Type: ops, security
- Description: procedure standard en cas de panne ingestion ou incident securite.
- Taches:
  - runbook pas a pas
  - roles et escalade
  - checklist post-mortem
- Critere d'acceptation:
  - runbook teste sur exercice
- Dependances: BL-011

## Definition of Ready
- besoin utilisateur clair
- impact metier defini
- dependances identifiees
- estimation donnee
- criteres d'acceptation ecrits

## Definition of Done
- code merge
- tests verts
- documentation mise a jour
- logs/monitoring verifies
- demonstration fonctionnelle validee

## KPIs (30 jours)
- taux ingestion sans reprise manuelle >= 95%
- classification correcte premier passage >= 80%
- temps moyen traitement avocat -30%
- zero secret hardcode detecte
- couverture tests modules critiques >= 70%
