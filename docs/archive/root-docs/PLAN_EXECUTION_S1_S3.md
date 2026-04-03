# 🚀 Plan d'Exécution Opérationnel S1/S2/S3 - MemoLib

## 📊 Vue d'Ensemble

**Objectif commun**: Une seule source de vérité, 0 perte d'info entre canaux, pilotage par KPI hebdo  
**Durée totale**: 8 semaines (2+2+4)  
**Équipe**: 6 personnes (Product Owner, Lead Backend, Lead Frontend, Ops Finance, Data/BI, Sec/Compliance)

---

## 📅 SPRINT 1 (Semaines 1-2) - Fondations

### Lot 1.1: Notes + Tâches + Documents + Inbox Multi-Canaux

**Owner**: Lead Backend + Product Owner  
**Durée**: 2 semaines  
**Priorité**: P1 (Critique)

#### User Stories

**US-1.1.1** [P1] - Timeline Unifiée
```
En tant qu'avocat
Je veux voir tous les événements (emails, notes, tâches, docs) dans une timeline unique
Afin d'avoir une vue complète du dossier sans changer d'onglet

DoD:
- Timeline affiche events triés par date DESC
- Filtres: type (email/note/task/doc), date, auteur
- Chargement lazy (50 items/page)
- Temps réponse <500ms pour 1000 events
```

**US-1.1.2** [P1] - Notes Contextuelles
```
En tant qu'avocat
Je veux ajouter des notes privées/partagées sur un dossier
Afin de documenter mes réflexions et partager avec l'équipe

DoD:
- Création note avec markdown
- Visibilité: privée/équipe/client
- Mention @utilisateur avec notification
- Édition/suppression avec audit trail
- Recherche full-text dans notes
```

**US-1.1.3** [P1] - Gestion Tâches
```
En tant qu'avocat
Je veux créer des tâches liées à un dossier avec échéances
Afin de ne rien oublier dans le suivi

DoD:
- Création tâche: titre, description, due_date, assignee
- Statuts: TODO/IN_PROGRESS/DONE
- Dépendances entre tâches (bloqué par)
- Notifications 24h avant échéance
- Vue Kanban + Liste
```

**US-1.1.4** [P1] - Documents Versionnés
```
En tant qu'avocat
Je veux uploader des documents avec versioning automatique
Afin de garder l'historique des modifications

DoD:
- Upload multi-fichiers (drag & drop)
- Versioning auto (v1, v2, v3...)
- Métadonnées: type doc, date, auteur
- Prévisualisation PDF/images
- Téléchargement version spécifique
```

**US-1.1.5** [P1] - Inbox Multi-Canaux
```
En tant qu'avocat
Je veux recevoir emails/SMS/Telegram dans une inbox unifiée
Afin de traiter tous les messages au même endroit

DoD:
- Inbox affiche messages de tous canaux
- Filtres: canal, lu/non-lu, date
- Action: répondre, archiver, créer dossier
- Indicateur canal (📧/📱/💬)
- Temps qualification <2min/message
```

#### KPI Sprint 1 - Lot 1.1

| Métrique | Baseline | Cible S1 | Mesure |
|----------|----------|----------|--------|
| Temps qualification message | 5 min | 3.5 min (-30%) | Temps moyen entre réception et action |
| % dossiers complets 48h | 60% | 75% (+25%) | Dossiers avec pièces + infos obligatoires |
| Taux centralisation | 70% | >90% | Interactions captées / interactions totales |

---

### Lot 1.2: Droits d'Accès + Audit + Partage Interne

**Owner**: Lead Backend + Sec/Compliance  
**Durée**: 2 semaines  
**Priorité**: P1 (Critique)

#### User Stories

**US-1.2.1** [P1] - Rôles et Permissions
```
En tant qu'administrateur
Je veux définir des rôles avec permissions granulaires
Afin de contrôler l'accès aux données sensibles

DoD:
- Rôles: OWNER, ADMIN, AGENT, CLIENT
- Permissions: READ, WRITE, DELETE, SHARE par ressource
- Héritage de permissions (dossier → documents)
- Interface admin pour gestion rôles
- Tests unitaires permissions
```

**US-1.2.2** [P1] - Audit Trail Complet
```
En tant que responsable conformité
Je veux tracer toutes les actions sur les données
Afin de respecter RGPD et avoir preuve en cas d'audit

DoD:
- Log: qui, quoi, quand, IP, user-agent
- Actions tracées: CREATE, READ, UPDATE, DELETE, SHARE
- Stockage immuable (append-only)
- Rétention 3 ans minimum
- Export CSV pour audit externe
```

**US-1.2.3** [P1] - Partage Sécurisé
```
En tant qu'avocat
Je veux partager un document avec un client via lien sécurisé
Afin d'éviter l'envoi par email non chiffré

DoD:
- Génération lien unique avec token
- Expiration configurable (1h à 30j)
- Mot de passe optionnel
- Limite téléchargements (1 à illimité)
- Notification à chaque accès
```

**US-1.2.4** [P2] - Chiffrement Données Sensibles
```
En tant que responsable sécurité
Je veux chiffrer les données sensibles au repos
Afin de protéger contre vol de base de données

DoD:
- Chiffrement AES-256 pour champs sensibles
- Clés stockées dans Azure Key Vault / user-secrets
- Rotation clés tous les 90 jours
- Déchiffrement transparent pour utilisateurs autorisés
```

#### KPI Sprint 1 - Lot 1.2

| Métrique | Baseline | Cible S1 | Mesure |
|----------|----------|----------|--------|
| % actions tracées | 80% | >98% | Actions loggées / actions totales |
| Incidents accès non autorisé | 2/mois | 0 incident critique | Alertes sécurité |
| Temps réponse audit | 5 jours | <2 jours | Délai export logs pour audit |

---

## 📅 SPRINT 2 (Semaines 3-4) - Productivité

### Lot 2.1: Calendrier (Échéances, Rappels, SLA)

**Owner**: Lead Frontend + Lead Backend  
**Durée**: 2 semaines  
**Priorité**: P1 (Critique)

#### User Stories

**US-2.1.1** [P1] - Calendrier Intégré
```
En tant qu'avocat
Je veux voir toutes mes échéances dans un calendrier
Afin de planifier ma charge de travail

DoD:
- Vue mois/semaine/jour
- Affichage: tâches, audiences, deadlines
- Couleurs par type/priorité
- Drag & drop pour reprogrammer
- Sync Google Calendar (optionnel)
```

**US-2.1.2** [P1] - Rappels Automatiques
```
En tant qu'avocat
Je veux recevoir des rappels avant les échéances
Afin de ne jamais manquer une deadline critique

DoD:
- Rappels: 7j, 3j, 1j, 2h avant échéance
- Canaux: email, Telegram, notification in-app
- Configuration par utilisateur
- Snooze possible (1h, 1j)
- Historique rappels envoyés
```

**US-2.1.3** [P1] - SLA par Type de Dossier
```
En tant qu'administrateur
Je veux définir des SLA par type de dossier
Afin de garantir les délais de traitement

DoD:
- Configuration SLA: délai réponse, délai résolution
- Alertes si SLA en risque (80% temps écoulé)
- Dashboard SLA: % respectés, retards
- Escalade automatique si dépassement
```

**US-2.1.4** [P2] - Détection Échéances Juridiques
```
En tant qu'avocat
Je veux que le système détecte les échéances dans les emails
Afin de ne pas les saisir manuellement

DoD:
- Regex détection dates (OQTF, appel, etc.)
- Extraction automatique dans calendrier
- Confirmation utilisateur avant ajout
- Apprentissage patterns par cabinet
```

#### KPI Sprint 2 - Lot 2.1

| Métrique | Baseline | Cible S2 | Mesure |
|----------|----------|----------|--------|
| % échéances tenues | 75% | >85% | Tâches terminées avant due_date |
| Nb retards critiques | 10/mois | 7/mois (-30%) | Retards >3 jours sur échéances P1 |
| Temps saisie échéance | 3 min | <1 min | Temps moyen création événement calendrier |

---

### Lot 2.2: Facturation (Temps → Préfacture → Facture)

**Owner**: Ops Finance + Lead Backend  
**Durée**: 2 semaines  
**Priorité**: P1 (Critique)

#### User Stories

**US-2.2.1** [P1] - Suivi Temps
```
En tant qu'avocat
Je veux enregistrer mon temps passé sur chaque dossier
Afin de facturer précisément mes prestations

DoD:
- Timer start/stop avec description
- Saisie manuelle (date, durée, description)
- Catégories: consultation, rédaction, audience, etc.
- Taux horaire par avocat/catégorie
- Export Excel pour validation
```

**US-2.2.2** [P1] - Génération Préfacture
```
En tant qu'avocat
Je veux générer une préfacture depuis les temps saisis
Afin de valider avant envoi au client

DoD:
- Sélection période + dossier
- Calcul auto: temps × taux horaire
- Ajout frais (déplacements, copies, etc.)
- Remises/majorations
- Prévisualisation PDF
```

**US-2.2.3** [P1] - Facture Finale
```
En tant qu'administrateur
Je veux transformer une préfacture en facture officielle
Afin de l'envoyer au client et comptabiliser

DoD:
- Numérotation auto (FAC-2025-001)
- Mentions légales obligatoires
- Génération PDF conforme
- Envoi email avec lien paiement
- Statut: brouillon/envoyée/payée/annulée
```

**US-2.2.4** [P2] - Suivi Paiements
```
En tant qu'administrateur
Je veux suivre l'état des paiements
Afin de relancer les impayés

DoD:
- Dashboard: factures en attente, payées, retard
- Relance auto J+30, J+60
- Enregistrement paiement (date, montant, mode)
- Export comptable (CSV)
```

#### KPI Sprint 2 - Lot 2.2

| Métrique | Baseline | Cible S2 | Mesure |
|----------|----------|----------|--------|
| Délai clôture → facture | 10 jours | <5 jours | Moyenne (date facture - date fin prestation) |
| Taux paiement à échéance | 65% | >80% | Factures payées avant J+30 |
| Temps création facture | 20 min | <10 min | Temps moyen génération facture |

---

## 📅 SPRINT 3 (Semaines 5-8) - Automatisation & Pilotage

### Lot 3.1: Automatisations (Règles, Relances, Assignation)

**Owner**: Lead Backend + Ops  
**Durée**: 4 semaines  
**Priorité**: P1 (Critique)

#### User Stories

**US-3.1.1** [P1] - Moteur de Règles
```
En tant qu'administrateur
Je veux créer des règles d'automatisation
Afin de réduire les tâches répétitives

DoD:
- Déclencheurs: email reçu, tâche créée, échéance proche
- Conditions: expéditeur, mots-clés, priorité, etc.
- Actions: créer tâche, assigner, notifier, tagger
- Interface no-code pour création règles
- Logs exécution règles
```

**US-3.1.2** [P1] - Assignation Automatique
```
En tant qu'administrateur
Je veux assigner automatiquement les dossiers
Afin d'équilibrer la charge de travail

DoD:
- Règles: round-robin, compétence, charge actuelle
- Prise en compte absences/congés
- Réassignation si pas de réponse sous 24h
- Dashboard charge par avocat
```

**US-3.1.3** [P1] - Relances Automatiques
```
En tant qu'avocat
Je veux que le système relance automatiquement les clients
Afin de ne pas oublier les suivis

DoD:
- Relances: pièces manquantes, réponse attendue, paiement
- Templates personnalisables
- Fréquence configurable (J+3, J+7, J+14)
- Stop auto si réponse reçue
```

**US-3.1.4** [P2] - Workflows Personnalisés
```
En tant qu'administrateur
Je veux créer des workflows par type de dossier
Afin de standardiser les processus

DoD:
- Étapes: réception, qualification, traitement, clôture
- Transitions conditionnelles
- Tâches auto-créées à chaque étape
- Visualisation graphique workflow
```

#### KPI Sprint 3 - Lot 3.1

| Métrique | Baseline | Cible S3 | Mesure |
|----------|----------|----------|--------|
| Tâches auto-générées | 20% | 60% (+40%) | Tâches créées par règles / tâches totales |
| Temps administratif | 8h/sem | 6h/sem (-25%) | Temps moyen tâches répétitives |
| Taux réponse relances | 40% | >60% | Clients répondant aux relances auto |

---

### Lot 3.2: Reporting Direction + Qualité Service

**Owner**: Data/BI + Product Owner  
**Durée**: 4 semaines  
**Priorité**: P2 (Important)

#### User Stories

**US-3.2.1** [P1] - Dashboard Direction
```
En tant que directeur
Je veux voir les KPI clés du cabinet
Afin de piloter l'activité

DoD:
- KPI: CA, marge, nb dossiers, taux occupation
- Graphiques: évolution mensuelle, comparaison N-1
- Filtres: période, avocat, type dossier
- Export PDF pour CODIR
- Actualisation temps réel
```

**US-3.2.2** [P1] - Analyse Rentabilité
```
En tant que directeur
Je veux analyser la rentabilité par dossier/avocat
Afin d'optimiser l'allocation des ressources

DoD:
- Calcul: CA - coûts (temps × taux horaire)
- Marge par dossier, par avocat, par type
- Identification dossiers déficitaires
- Recommandations IA (augmenter taux, réduire temps)
```

**US-3.2.3** [P2] - Satisfaction Client (CSAT)
```
En tant que responsable qualité
Je veux mesurer la satisfaction client
Afin d'améliorer le service

DoD:
- Enquête auto envoyée à clôture dossier
- Questions: réactivité, clarté, résultat (1-5)
- Calcul CSAT global et par avocat
- Alertes si note <3/5
- Analyse verbatims (IA)
```

**US-3.2.4** [P2] - Funnel Conversion
```
En tant que directeur commercial
Je veux suivre le funnel prospect → client
Afin d'optimiser l'acquisition

DoD:
- Étapes: contact, consultation, devis, signature
- Taux conversion par étape
- Temps moyen par étape
- Identification points de friction
```

#### KPI Sprint 3 - Lot 3.2

| Métrique | Baseline | Cible S3 | Mesure |
|----------|----------|----------|--------|
| Marge/dossier | 1200€ | 1320€ (+10%) | Moyenne (CA - coûts) par dossier |
| CSAT | 4.0/5 | >4.3/5 | Note moyenne satisfaction client |
| Conversion prospect→client | 35% | 40% (+15%) | Nb clients / nb prospects contactés |

---

## 🎯 Cadence de Pilotage

### Daily Standup (15 min)
- **Participants**: Toute l'équipe
- **Format**: Chacun répond à 3 questions
  1. Qu'ai-je fait hier ?
  2. Que vais-je faire aujourd'hui ?
  3. Ai-je des blocages ?
- **Focus**: Incidents flux entrant/sortant, blocages techniques

### Revue Hebdomadaire (1h)
- **Participants**: Product Owner + Leads + Ops
- **Agenda**:
  1. Revue KPI (écart cible/réel)
  2. Analyse causes écarts
  3. Plan d'actions correctives
  4. Ajustement backlog si nécessaire
- **Livrables**: Compte-rendu + actions avec owner/deadline

### Démo Fin de Sprint (2h)
- **Participants**: Équipe + Stakeholders métier
- **Agenda**:
  1. Démo fonctionnalités livrées
  2. Validation conformité (RGPD, permissions, traçabilité)
  3. Feedback utilisateurs
  4. Planification sprint suivant
- **Livrables**: PV validation + backlog S+1

---

## 📊 Définitions KPI Détaillées

### KPI Opérationnels

**% dossiers complets 48h**
```
Formule: (Nb dossiers avec pièces + infos obligatoires sous 48h) / (Nb dossiers créés) × 100
Seuil alerte: <70%
Fréquence mesure: Quotidienne
Source: Table Cases + CaseDocuments
```

**Taux centralisation**
```
Formule: (Nb interactions captées dans timeline) / (Nb interactions totales estimées) × 100
Seuil alerte: <85%
Fréquence mesure: Hebdomadaire
Source: Table Events + logs externes
```

**Délai clôture → facture**
```
Formule: Moyenne(Date facture - Date fin prestation) en jours
Seuil alerte: >7 jours
Fréquence mesure: Hebdomadaire
Source: Table Invoices + Cases
```

### KPI Qualité

**% échéances tenues**
```
Formule: (Nb tâches terminées avant due_date) / (Nb tâches avec due_date) × 100
Seuil alerte: <80%
Fréquence mesure: Hebdomadaire
Source: Table CaseTasks
```

**CSAT (Customer Satisfaction Score)**
```
Formule: Moyenne(Notes satisfaction client) sur échelle 1-5
Seuil alerte: <4.0
Fréquence mesure: Mensuelle
Source: Table SatisfactionSurveys
```

### KPI Business

**Marge par dossier**
```
Formule: Moyenne(CA facturé - Coûts temps passé) par dossier
Seuil alerte: <1000€
Fréquence mesure: Mensuelle
Source: Table Invoices + TimeEntries
```

**Taux conversion prospect → client**
```
Formule: (Nb prospects devenus clients) / (Nb prospects contactés) × 100
Seuil alerte: <30%
Fréquence mesure: Mensuelle
Source: Table Clients (statut)
```

---

## 🚨 Gestion des Risques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Retard migration données | Moyenne | Élevé | Démarrer migration dès S1, tests en parallèle |
| Résistance utilisateurs | Élevée | Moyen | Formation continue, champions internes |
| Bugs critiques production | Faible | Élevé | Tests E2E, rollback plan, monitoring 24/7 |
| Dérive scope | Moyenne | Moyen | Backlog priorisé strict, validation PO obligatoire |
| Indisponibilité services externes | Faible | Moyen | Fallback local (Ollama, SQLite), retry logic |

---

## ✅ Critères de Succès Globaux

**Sprint 1**
- ✅ 100% US P1 livrées et validées
- ✅ 0 incident sécurité critique
- ✅ Temps qualification <3.5 min

**Sprint 2**
- ✅ 100% US P1 livrées et validées
- ✅ Délai clôture→facture <5 jours
- ✅ >85% échéances tenues

**Sprint 3**
- ✅ 100% US P1 livrées et validées
- ✅ 60% tâches auto-générées
- ✅ CSAT >4.3/5

**Global (fin S3)**
- ✅ Adoption >90% équipe
- ✅ ROI positif (gain temps > coût dev)
- ✅ 0 perte de données
- ✅ Conformité RGPD 100%
