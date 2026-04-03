# Issues GitHub pretes a publier

## BL-001 - Stabiliser le parcours email simulateur
Labels: p0, email, ux
Milestone: Sprint 1

### Contexte
Valider le flux complet compose -> ingest -> confirmation.

### Taches
- verifier envoi depuis le simulateur
- verifier scan manuel boite reelle
- harmoniser messages d'erreur utilisateur

### Critere d'acceptation
- envoi OK
- scan manuel retourne un statut lisible
- aucune erreur JS en console sur le parcours principal

### Dependances
- none

---

## BL-002 - Normaliser les erreurs API critiques
Labels: p0, api, tests
Milestone: Sprint 1

### Contexte
Uniformiser le format de reponse erreur pour login, ingest, scan.

### Taches
- definir schema unique error/message/details/code
- appliquer sur endpoints critiques
- ajouter tests de contrat API

### Critere d'acceptation
- format stable sur endpoints critiques
- tests de contrat passes

### Dependances
- BL-001

---

## BL-003 - Verrouiller gates qualite pre-merge
Labels: p0, infra, tests
Milestone: Sprint 1

### Contexte
Rendre obligatoires lint, typecheck et tests modules critiques.

### Taches
- configurer workflow CI
- marquer checks requis
- documenter commandes locales

### Critere d'acceptation
- merge bloque si checks KO
- documentation dev a jour

### Dependances
- none

---

## BL-004 - Hygiene secrets et conformite minimale
Labels: p0, security
Milestone: Sprint 1

### Contexte
Supprimer secrets hardcodes et renforcer hygiene repository.

### Taches
- audit fichiers md/ps1/js
- suppression secrets hardcodes
- regles gitignore et validation pre-commit

### Critere d'acceptation
- zero secret detecte au scan
- workflow documente

### Dependances
- none

---

## BL-005 - Idempotence ingestion email
Labels: p1, email, api
Milestone: Sprint 2

### Contexte
Eviter les doublons d'evenements en cas de retry ou rescan.

### Taches
- definir cle d'idempotence
- persistance hash message
- tests de resoumission

### Critere d'acceptation
- double soumission sans doublon

### Dependances
- BL-002

---

## BL-006 - Tableau de bord ingestion
Labels: p1, email, ux
Milestone: Sprint 2

### Contexte
Exposer volume, erreurs, latence et succes ingestion.

### Taches
- endpoint stats ingestion
- carte UI de suivi
- alertes seuils critiques

### Critere d'acceptation
- stats visibles en moins de 2 clics
- seuils d'alerte actifs

### Dependances
- BL-005

---

## BL-007 - Score de confiance et justification
Labels: p1, legal, ux
Milestone: Sprint 2

### Contexte
Afficher pourquoi un email est classe urgent ou normal.

### Taches
- score + rationale
- mapping mots-cles, dates, contexte
- tests de regression classification

### Critere d'acceptation
- chaque classification affiche une explication

### Dependances
- BL-002

---

## BL-008 - Inbox priorisee avocat
Labels: p1, ux, legal
Milestone: Sprint 3

### Contexte
Trier par urgence legale et echeance.

### Taches
- tri multi-criteres
- filtres urgents et dossiers lies
- vue actions rapides

### Critere d'acceptation
- top urgences visible instantanement

### Dependances
- BL-007

---

## BL-009 - Actions rapides depuis email
Labels: p1, ux
Milestone: Sprint 3

### Contexte
Creer dossier, demander pieces, planifier rappel en un clic.

### Taches
- boutons contextuels
- templates de reponse pre-remplis
- tracking action effectuee

### Critere d'acceptation
- reduction du temps moyen de traitement de 30%

### Dependances
- BL-008

---

## BL-010 - Historique unifie par dossier
Labels: p2, ux, api
Milestone: Sprint 3

### Contexte
Timeline complete emails + actions + statuts.

### Taches
- model timeline
- endpoint lecture timeline
- composant UI chronologique

### Critere d'acceptation
- historisation complete consultable

### Dependances
- BL-009

---

## BL-011 - SLO et monitoring service
Labels: p1, infra
Milestone: Sprint 4

### Contexte
Definir et monitorer latence, erreurs et succes ingestion.

### Taches
- definir objectifs SLO
- instrumenter API
- configurer alertes

### Critere d'acceptation
- dashboard SLO actif
- alertes operationnelles

### Dependances
- BL-006

---

## BL-012 - Playbook incident
Labels: p2, ops, security
Milestone: Sprint 4

### Contexte
Procedure standard en cas de panne ingestion ou incident securite.

### Taches
- runbook pas a pas
- roles et escalade
- checklist post-mortem

### Critere d'acceptation
- runbook teste sur exercice

### Dependances
- BL-011
