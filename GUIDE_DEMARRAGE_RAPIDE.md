# 🚀 Guide Démarrage Rapide - Option 2 (12 semaines)

## ✅ Checklist Jour 1

### 1️⃣ Validation Projet (1h)

**Budget & Ressources**
```
☐ Budget validé: 144 000€ (12 semaines × 6 personnes)
☐ Équipe confirmée:
  ☐ Product Owner
  ☐ Lead Backend
  ☐ Lead Frontend
  ☐ Ops Finance
  ☐ Data/BI
  ☐ Sec/Compliance
☐ Environnement dev prêt (machines, licences)
```

---

### 2️⃣ Configuration Technique (30 min)

**Environnement Local**
```powershell
# 1. Vérifier l'application tourne
# L'API est déjà lancée sur http://localhost:5078

# 2. Tester l'accès
start http://localhost:5078/demo.html

# 3. Créer compte admin test
# Via interface → Inscription → Login

# 4. Configuration services gratuits (optionnel)
.\configure-opensource-simple.ps1
```

**Base de Données**
```powershell
# Vérifier migrations à jour
dotnet ef database update

# Backup initial
copy memolib.db memolib.db.backup
```

---

### 3️⃣ Import Jira (15 min)

**Méthode 1: Import CSV (Recommandé)**
```
1. Ouvrir Jira → Settings → System → Import
2. Sélectionner "CSV"
3. Upload: JIRA_IMPORT_BACKLOG_S1_S3.csv
4. Mapper colonnes:
   - Summary → Summary
   - Issue Type → Issue Type
   - Epic Link → Epic Link
   - Story Points → Story Points
   - Priority → Priority
   - Labels → Labels
5. Import → Valider
```

**Méthode 2: Copier-Coller Manuel**
```
1. Ouvrir JIRA_READY.md
2. Créer Epic S1 → Copier description
3. Créer Story US1 → Copier AC + Tasks
4. Répéter pour les 18 US
```

**Vérification**
```
☐ 3 Epics créés (S1, S2, S3)
☐ 18 Stories créées (US1-US18)
☐ Story Points assignés
☐ Priorités correctes (Highest/High/Medium)
☐ Labels présents (sprint1, p1, role-client, etc.)
```

---

### 4️⃣ Configuration Sprint 1 (30 min)

**Créer Sprint Jira**
```
1. Jira → Backlog → Create Sprint
2. Nom: "Sprint 1 - Centralisation Multi-Rôles"
3. Dates: [Date début] → [Date début + 4 semaines]
4. Glisser US dans sprint:
   ☐ US1 (8 pts)
   ☐ US2 (5 pts)
   ☐ US3 (5 pts)
   ☐ US4 (8 pts)
   ☐ US5 (8 pts)
   ☐ US10 (8 pts)
   ☐ US11 (5 pts)
   ☐ US12 (8 pts)
5. Total: 55 points
6. Start Sprint
```

**Assignation Initiale**
```
Lead Backend:
  ☐ US1 - Ingestion multi-canaux (8 pts)
  ☐ US5 - Permissions + audit (8 pts)

Lead Frontend:
  ☐ US10 - Portail client (8 pts)
  ☐ US12 - Triage assistant (8 pts)

Backend Dev:
  ☐ US2 - Notes collaboratives (5 pts)
  ☐ US3 - Tâches dossier (5 pts)
  ☐ US4 - Documents versionnés (8 pts)

Frontend Dev:
  ☐ US11 - Upload client guidé (5 pts)
```

---

## 📅 Semaine 1 - Actions Immédiates

### Lundi (Jour 1)

**Matin: Kick-off (2h)**
```
09:00 - Présentation projet (30 min)
  - Vision: Centralisation multi-rôles
  - Objectifs: 142 pts en 12 semaines
  - ROI: Break-even 19 mois

09:30 - Présentation backlog (30 min)
  - 3 Epics, 18 US
  - Priorisation par rôle
  - KPI par sprint

10:00 - Organisation équipe (30 min)
  - Rôles & responsabilités
  - Rituels agiles (daily, hebdo, démo)
  - Outils (Jira, Git, Slack)

10:30 - Sprint 1 Planning (30 min)
  - US1-5, US10-12 (55 pts)
  - Assignation tâches
  - Définition of Done
```

**Après-midi: Setup Technique (4h)**
```
14:00 - Configuration environnements
  ☐ Cloner repo Git
  ☐ Installer dépendances
  ☐ Lancer app en local
  ☐ Tester API (Postman/Swagger)

16:00 - Architecture review
  ☐ Présentation architecture existante
  ☐ Patterns à suivre (CQRS, Repository)
  ☐ Conventions code (naming, tests)

17:00 - Première tâche
  ☐ Créer branche feature/US1-ingestion
  ☐ Commencer implémentation
```

---

### Mardi-Vendredi (Jours 2-5)

**Daily Standup (15 min - 09:00)**
```
Chacun répond:
1. Qu'ai-je fait hier?
2. Que vais-je faire aujourd'hui?
3. Ai-je des blocages?
```

**Développement (6h/jour)**
```
09:15 - 12:00 : Dev
12:00 - 13:00 : Pause
13:00 - 16:00 : Dev
16:00 - 17:00 : Code review / Tests
```

**Objectif Semaine 1**
```
☐ US1 - Ingestion multi-canaux: 50% (API endpoint)
☐ US2 - Notes collaboratives: 80% (CRUD complet)
☐ US5 - Permissions + audit: 30% (Middleware auth)
```

---

## 📊 Rituels Agiles

### Daily Standup (15 min - 09:00)
```
Format:
- Tour de table (2 min/personne)
- Blocages identifiés
- Actions immédiates

Outils:
- Jira Board (vue Kanban)
- Slack #daily-standup
```

### Revue Hebdomadaire (1h - Vendredi 16:00)
```
Agenda:
1. Revue KPI (15 min)
   - Vélocité réelle vs cible
   - Burndown chart
   - Blocages récurrents

2. Démo interne (30 min)
   - US terminées
   - Feedback équipe

3. Planification semaine suivante (15 min)
   - Priorisation backlog
   - Ajustements si nécessaire
```

### Démo Fin de Sprint (2h - Semaine 4)
```
Participants: Équipe + Stakeholders

Agenda:
1. Démo fonctionnalités (45 min)
   - US1-5, US10-12
   - Scénarios utilisateur

2. Revue KPI Sprint 1 (30 min)
   - Temps qualification: -30%?
   - Taux centralisation: >90%?

3. Rétrospective (30 min)
   - What went well?
   - What to improve?
   - Actions sprint 2

4. Planning Sprint 2 (15 min)
   - US6-7, US13-16 (45 pts)
```

---

## 🎯 Premiers Livrables (Semaine 1)

### US1 - Ingestion Multi-Canaux (50%)
```
☐ Endpoint POST /api/ingest/unified
☐ Mapping canal → event (email, SMS, Telegram)
☐ Tests unitaires déduplication
☐ Documentation API (Swagger)
```

### US2 - Notes Collaboratives (80%)
```
☐ Table CaseNotes créée
☐ API CRUD /api/cases/{id}/notes
☐ Tests E2E CRUD
☐ Frontend: Formulaire création note
```

### US5 - Permissions + Audit (30%)
```
☐ Middleware authorization
☐ Table AuditLogs créée
☐ Tests unitaires permissions
☐ Documentation rôles (OWNER, ADMIN, AGENT, CLIENT)
```

---

## 📞 Contacts & Support

### Équipe Core
```
Product Owner: [Nom] - [Email] - [Slack]
Lead Backend: [Nom] - [Email] - [Slack]
Lead Frontend: [Nom] - [Email] - [Slack]
```

### Canaux Communication
```
Slack:
  #memolib-dev (technique)
  #memolib-product (fonctionnel)
  #memolib-daily (standup)

Jira:
  https://[votre-instance].atlassian.net/jira/software/projects/MEMO

Git:
  https://github.com/[votre-org]/MemoLib
```

---

## 🚨 Troubleshooting

### Application ne démarre pas
```powershell
# Vérifier port libre
netstat -ano | findstr :5078

# Tuer processus si nécessaire
taskkill /PID [PID] /F

# Relancer
dotnet run --urls http://localhost:5078
```

### Erreur base de données
```powershell
# Supprimer et recréer
Remove-Item memolib.db
dotnet ef database update
```

### Erreur dépendances
```powershell
# Restaurer packages
dotnet restore
dotnet build
```

---

## ✅ Checklist Fin Jour 1

```
☐ Budget validé
☐ Équipe confirmée (6 personnes)
☐ Application tourne en local
☐ Jira configuré (3 Epics + 18 US)
☐ Sprint 1 créé et démarré (55 pts)
☐ Tâches assignées
☐ Kick-off réalisé
☐ Première branche Git créée
☐ Première ligne de code écrite
```

**Si toutes les cases sont cochées: Vous êtes prêt ! 🚀**

---

## 📚 Documentation Disponible

```
PLAN_EXECUTION_OPTION2_12_SEMAINES.md  → Plan complet 12 semaines
JIRA_IMPORT_BACKLOG_S1_S3.csv          → Import Jira
JIRA_READY.md                          → Documentation US
BACKLOG_PRIORITE.md                    → Backlog détaillé
KPI_DASHBOARD.md                       → Métriques & KPI
CLES_ENV_EXTERNES_MANQUANTES.md        → Configuration services
```

**Prêt à démarrer Sprint 1 ! 🎯**
