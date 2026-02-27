# 🎯 Version Prête Jira - MemoLib

## 📋 Format Copier-Coller Direct

---

## 🔥 EPIC S1 — Centralisation Dossier (P1)

**Epic Name**: Centralisation Dossier  
**Priority**: Highest  
**Story Points**: 34  
**Sprint**: Sprint 1 (Semaines 1-2)

**Description**:
Centraliser toutes les interactions (emails, SMS, Telegram, notes, tâches, documents) dans une timeline unique par dossier avec permissions granulaires et audit complet.

**Business Value**:
- Réduction 30% temps qualification
- +25% dossiers complets sous 48h
- >90% taux centralisation

---

### 📌 US1 - Ingestion multi-canaux vers timeline dossier

**Type**: Story  
**Epic Link**: Epic S1  
**Priority**: Highest  
**Story Points**: 8

**Description**:
En tant qu'avocat, je veux que tous les messages (email/SMS/Telegram) apparaissent automatiquement dans la timeline du dossier afin d'avoir une vue complète sans changer d'onglet.

**Acceptance Criteria**:
```
✓ 1 message entrant = 1 event horodaté dans timeline
✓ Visible dans dossier lié
✓ Pas de doublon (déduplication par ID externe)
✓ Indicateur canal (📧/📱/💬)
✓ Temps réponse <500ms pour 1000 events
```

**Technical Tasks**:
- [ ] Endpoint unifié POST /api/ingest/unified
- [ ] Mapping canal→event (type, source_id)
- [ ] Déduplication par checksum
- [ ] Tests webhook (email, SMS, Telegram)
- [ ] API GET /api/cases/{id}/timeline avec pagination

**Definition of Done**:
- [ ] Tests E2E passent (1000+ events)
- [ ] Code review approuvé
- [ ] Documentation API mise à jour
- [ ] Démo validée par PO

---

### 📌 US2 - Notes dossier collaboratives

**Type**: Story  
**Epic Link**: Epic S1  
**Priority**: Highest  
**Story Points**: 5

**Description**:
En tant qu'avocat, je veux ajouter des notes privées/partagées sur un dossier avec mentions @utilisateur afin de documenter mes réflexions et collaborer avec l'équipe.

**Acceptance Criteria**:
```
✓ Notes triées par date DESC
✓ Mentions @user persistées avec notifications
✓ Accès limité selon visibilité (privée/équipe/client)
✓ Édition/suppression avec audit trail
✓ Recherche full-text dans notes
```

**Technical Tasks**:
- [ ] Table CaseNotes (id, case_id, content, visibility, author_id, created_at)
- [ ] CRUD API /api/cases/{id}/notes
- [ ] Mentions @user avec notifications
- [ ] Filtre privé/public
- [ ] Audit trail (CREATE, UPDATE, DELETE)

**Definition of Done**:
- [ ] Tests unitaires >80% coverage
- [ ] Notifications fonctionnelles
- [ ] Audit trail vérifié
- [ ] Démo validée

---

### 📌 US3 - Tâches dossier

**Type**: Story  
**Epic Link**: Epic S1  
**Priority**: Highest  
**Story Points**: 5

**Description**:
En tant qu'avocat, je veux créer des tâches liées à un dossier avec échéances et assignation afin de ne rien oublier dans le suivi.

**Acceptance Criteria**:
```
✓ Changement de statut tracé (TODO→IN_PROGRESS→DONE)
✓ Filtre "en retard" opérationnel (due_date < NOW AND status != DONE)
✓ Assignation avec notification
✓ Dépendances entre tâches (blocked_by)
✓ Vue Kanban + Liste
```

**Technical Tasks**:
- [ ] Table CaseTasks (id, case_id, title, description, due_date, assignee_id, status, priority, blocked_by)
- [ ] CRUD API /api/cases/{id}/tasks
- [ ] Notifications 24h avant échéance
- [ ] Vue Kanban (drag & drop)
- [ ] Filtre par statut/assignee/priorité

**Definition of Done**:
- [ ] Vue Kanban fonctionnelle
- [ ] Notifications testées
- [ ] Dépendances gérées
- [ ] Démo validée

---

### 📌 US4 - Documents dossier

**Type**: Story  
**Epic Link**: Epic S1  
**Priority**: Highest  
**Story Points**: 8

**Description**:
En tant qu'avocat, je veux uploader des documents avec versioning automatique afin de garder l'historique des modifications.

**Acceptance Criteria**:
```
✓ Version N+1 créée automatiquement à chaque upload
✓ Contrôle d'accès strict (permissions par rôle)
✓ Fichier téléchargeable avec audit
✓ Métadonnées (type, date, auteur, tags)
✓ Prévisualisation PDF/images
```

**Technical Tasks**:
- [ ] Table CaseDocuments (id, case_id, filename, version, path, metadata, uploaded_by)
- [ ] Upload sécurisé POST /api/cases/{id}/documents (multipart)
- [ ] Versioning automatique (v1, v2, v3)
- [ ] Download protégé GET /api/documents/{id}/download
- [ ] Métadonnées/tags

**Definition of Done**:
- [ ] Versioning testé (v1→v10)
- [ ] Permissions vérifiées
- [ ] Prévisualisation fonctionnelle
- [ ] Démo validée

---

### 📌 US5 - Permissions + audit

**Type**: Story  
**Epic Link**: Epic S1  
**Priority**: Highest  
**Story Points**: 8

**Description**:
En tant qu'administrateur, je veux définir des permissions granulaires par rôle afin de contrôler l'accès aux données sensibles et tracer toutes les actions.

**Acceptance Criteria**:
```
✓ 401/403 corrects selon rôle
✓ Aucune fuite inter-dossiers (isolation tenant)
✓ Audit complet (qui, quoi, quand, IP)
✓ Rétention logs 3 ans minimum
✓ Export CSV pour audit externe
```

**Technical Tasks**:
- [ ] Table Roles (id, name, permissions JSON)
- [ ] Middleware authorization (check permissions)
- [ ] Policy par rôle (OWNER, ADMIN, AGENT, CLIENT)
- [ ] Ownership checks API (case.user_id == current_user.id)
- [ ] Table AuditLogs (user_id, action, resource, ip, timestamp)
- [ ] Journalisation actions critiques (CREATE, UPDATE, DELETE, SHARE)

**Definition of Done**:
- [ ] Tests permissions (100+ scénarios)
- [ ] Audit trail complet
- [ ] Export CSV fonctionnel
- [ ] Conformité RGPD validée

---

## 🔥 EPIC S2 — Orchestration (P2)

**Epic Name**: Orchestration  
**Priority**: High  
**Story Points**: 21  
**Sprint**: Sprint 2 (Semaines 3-4)

**Description**:
Automatiser la gestion des échéances, rappels, SLA et facturation pour optimiser la productivité et garantir les délais.

**Business Value**:
- >85% échéances tenues
- Délai clôture→facture <5 jours
- Taux paiement à échéance >80%

---

### 📌 US6 - Calendrier/SLA

**Type**: Story  
**Epic Link**: Epic S2  
**Priority**: High  
**Story Points**: 8

**Description**:
En tant qu'avocat, je veux voir toutes mes échéances dans un calendrier avec rappels automatiques afin de ne jamais manquer une deadline critique.

**Acceptance Criteria**:
```
✓ Rappels envoyés (7j, 3j, 1j, 2h avant échéance)
✓ Retards visibles en dashboard (tâches overdue)
✓ Alertes SLA en risque (>80% temps écoulé)
✓ Vue mois/semaine/jour
✓ Drag & drop pour reprogrammer
```

**Technical Tasks**:
- [ ] Table CalendarEvents (id, user_id, title, start, end, type, related_id)
- [ ] API GET /api/calendar (filtres date/type)
- [ ] Job scheduler rappels (Hangfire/Quartz)
- [ ] Vue agenda (react-big-calendar)
- [ ] Alertes retard (email, Telegram, in-app)
- [ ] Configuration SLA par type dossier

**Definition of Done**:
- [ ] Rappels testés (tous délais)
- [ ] Dashboard SLA fonctionnel
- [ ] Drag & drop opérationnel
- [ ] Démo validée

---

### 📌 US7 - Facturation de base

**Type**: Story  
**Epic Link**: Epic S2  
**Priority**: High  
**Story Points**: 13

**Description**:
En tant qu'avocat, je veux enregistrer mon temps passé et générer des factures afin de facturer précisément mes prestations.

**Acceptance Criteria**:
```
✓ Cycle temps→facture reproductible
✓ Total cohérent (temps × taux + frais)
✓ Numérotation auto (FAC-2025-001)
✓ Statuts: brouillon/envoyée/payée/annulée
✓ Export PDF conforme
```

**Technical Tasks**:
- [ ] Table TimeEntries (id, case_id, user_id, start, end, duration, description, category, rate)
- [ ] Timer start/stop avec description
- [ ] Table Invoices (id, case_id, status, items JSON, total, created_at)
- [ ] API POST /api/cases/{id}/invoices/draft (calcul auto)
- [ ] Génération PDF (iTextSharp/PuppeteerSharp)
- [ ] Mentions légales obligatoires
- [ ] Statut paiement (enregistrement date/montant)

**Definition of Done**:
- [ ] Timer fonctionnel
- [ ] Calcul facture correct
- [ ] PDF conforme
- [ ] Cycle complet testé

---

## 🔥 EPIC S3 — Différenciation (P3)

**Epic Name**: Différenciation  
**Priority**: Medium  
**Story Points**: 21  
**Sprint**: Sprint 3 (Semaines 5-8)

**Description**:
Automatiser les tâches répétitives et fournir des insights business pour optimiser la rentabilité et la qualité de service.

**Business Value**:
- 60% tâches auto-générées
- Temps admin -25%
- Marge/dossier +10%
- CSAT >4.3/5

---

### 📌 US8 - Automatisations métier

**Type**: Story  
**Epic Link**: Epic S3  
**Priority**: Medium  
**Story Points**: 13

**Description**:
En tant qu'administrateur, je veux créer des règles d'automatisation (si/alors) afin de réduire les tâches répétitives et standardiser les processus.

**Acceptance Criteria**:
```
✓ Règle active déclenche action sans intervention manuelle
✓ Déclencheurs: email reçu, tâche créée, échéance proche
✓ Actions: créer tâche, assigner, notifier, tagger
✓ Logs exécution règles
✓ Interface no-code création règles
```

**Technical Tasks**:
- [ ] Table AutomationRules (id, name, trigger, conditions JSON, actions JSON, enabled)
- [ ] Rules engine (évaluation conditions)
- [ ] Exécution actions (créer tâche, assigner, notifier)
- [ ] Assignation automatique (round-robin, charge, compétences)
- [ ] Relances automatiques (pièces, réponse, paiement)
- [ ] Logs exécution avec succès/échec

**Definition of Done**:
- [ ] 5 règles testées
- [ ] Interface no-code fonctionnelle
- [ ] Logs complets
- [ ] Démo validée

---

### 📌 US9 - Reporting direction

**Type**: Story  
**Epic Link**: Epic S3  
**Priority**: Medium  
**Story Points**: 8

**Description**:
En tant que directeur, je veux voir les KPI clés du cabinet (CA, marge, nb dossiers, taux occupation) afin de piloter l'activité et optimiser la rentabilité.

**Acceptance Criteria**:
```
✓ KPI visibles et cohérents avec données sources
✓ Graphiques évolution mensuelle + comparaison N-1
✓ Filtres: période, avocat, type dossier
✓ Export PDF pour CODIR
✓ Actualisation temps réel
```

**Technical Tasks**:
- [ ] API GET /api/analytics/dashboard
- [ ] Calcul KPI (CA, marge, nb dossiers, taux occupation)
- [ ] Agrégats dossiers/canaux/factures
- [ ] Analyse rentabilité par dossier/avocat
- [ ] Identification dossiers déficitaires
- [ ] Dashboard visuel (recharts)
- [ ] Filtres période/équipe
- [ ] Export PDF/Excel

**Definition of Done**:
- [ ] KPI cohérents (validation comptable)
- [ ] Dashboard responsive
- [ ] Export fonctionnel
- [ ] Démo validée

---

## 📊 Capacité & Plan

### Sprint 1 (Semaines 1-2)
**Capacité**: 34 points  
**User Stories**: US1, US2, US3, US4, US5  
**Objectif**: Centralisation complète avec permissions

### Sprint 2 (Semaines 3-4)
**Capacité**: 21 points  
**User Stories**: US6, US7  
**Objectif**: Orchestration échéances + facturation

### Sprint 3 (Semaines 5-8)
**Capacité**: 21 points  
**User Stories**: US8, US9  
**Objectif**: Automatisation + insights business

### Buffer Recommandé
**15%** pour aléas/intégration = **11 points** supplémentaires

**Total**: 76 points + 11 buffer = **87 points** sur 8 semaines

---

## 🎯 Import Jira

**Fichier CSV disponible**: `JIRA_IMPORT.csv`

**Colonnes**:
- Summary
- Issue Type (Epic/Story)
- Epic Link
- Story Points
- Priority
- Description
- Acceptance Criteria
- Technical Tasks

**Import via**: Jira → Settings → System → Import → CSV
