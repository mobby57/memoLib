# 📋 Backlog Priorisé - MemoLib

## 🎯 Légende Priorités

- **P1 (Critique)**: Bloquant pour MVP, doit être livré
- **P2 (Important)**: Améliore significativement l'expérience
- **P3 (Nice-to-have)**: Peut être reporté sans impact majeur

---

## 🔥 SPRINT 1 - Backlog Détaillé

### P1 - Timeline Unifiée (5 points)

**US-1.1.1**: Timeline Unifiée  
**Estimation**: 5 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: API GET /api/cases/{id}/timeline (pagination, filtres)
- [ ] Backend: Agrégation events (emails, notes, tasks, docs)
- [ ] Frontend: Composant Timeline avec lazy loading
- [ ] Frontend: Filtres (type, date, auteur)
- [ ] Tests: E2E timeline avec 1000+ events

**Critères d'acceptation**:
```gherkin
Given un dossier avec 500 événements
When j'ouvre la timeline
Then je vois les 50 premiers événements en <500ms
And je peux filtrer par type d'événement
And je peux charger les 50 suivants en scrollant
```

---

### P1 - Notes Contextuelles (3 points)

**US-1.1.2**: Notes Contextuelles  
**Estimation**: 3 points  
**Dépendances**: Timeline

**Tâches techniques**:
- [ ] Backend: Table CaseNotes (id, case_id, content, visibility, author_id)
- [ ] Backend: API POST/PUT/DELETE /api/cases/{id}/notes
- [ ] Backend: Mentions @user avec notifications
- [ ] Frontend: Éditeur markdown (SimpleMDE)
- [ ] Frontend: Sélecteur visibilité (privée/équipe/client)

**Critères d'acceptation**:
```gherkin
Given je suis sur un dossier
When je crée une note avec @jean
Then Jean reçoit une notification
And la note apparaît dans la timeline
And je peux éditer/supprimer ma note
```

---

### P1 - Gestion Tâches (5 points)

**US-1.1.3**: Gestion Tâches  
**Estimation**: 5 points  
**Dépendances**: Timeline

**Tâches techniques**:
- [ ] Backend: Table CaseTasks (id, case_id, title, description, due_date, assignee_id, status, blocked_by)
- [ ] Backend: API CRUD /api/cases/{id}/tasks
- [ ] Backend: Notifications 24h avant échéance
- [ ] Frontend: Vue Kanban (react-beautiful-dnd)
- [ ] Frontend: Vue Liste avec tri/filtres

**Critères d'acceptation**:
```gherkin
Given je suis sur un dossier
When je crée une tâche avec échéance demain
Then je reçois une notification 24h avant
And je peux drag & drop la tâche entre colonnes
And je peux définir une dépendance "bloqué par"
```

---

### P1 - Documents Versionnés (5 points)

**US-1.1.4**: Documents Versionnés  
**Estimation**: 5 points  
**Dépendances**: Timeline

**Tâches techniques**:
- [ ] Backend: Table CaseDocuments (id, case_id, filename, version, path, metadata)
- [ ] Backend: API POST /api/cases/{id}/documents (multipart)
- [ ] Backend: Versioning automatique (v1, v2, v3)
- [ ] Frontend: Upload drag & drop (react-dropzone)
- [ ] Frontend: Prévisualisation PDF (react-pdf)

**Critères d'acceptation**:
```gherkin
Given je suis sur un dossier
When j'uploade un document "contrat.pdf"
Then le document est enregistré en v1
When j'uploade à nouveau "contrat.pdf"
Then une v2 est créée automatiquement
And je peux télécharger n'importe quelle version
```

---

### P1 - Inbox Multi-Canaux (8 points)

**US-1.1.5**: Inbox Multi-Canaux  
**Estimation**: 8 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: Unification events (email, SMS, Telegram)
- [ ] Backend: API GET /api/inbox (filtres: canal, lu/non-lu)
- [ ] Backend: API POST /api/inbox/{id}/action (répondre, archiver, créer dossier)
- [ ] Frontend: Composant Inbox avec filtres
- [ ] Frontend: Actions rapides (boutons répondre, archiver)

**Critères d'acceptation**:
```gherkin
Given j'ai reçu 10 emails, 5 SMS, 3 Telegram
When j'ouvre l'inbox
Then je vois les 18 messages triés par date
And je peux filtrer par canal (📧/📱/💬)
And je peux créer un dossier depuis un message en <2 min
```

---

### P1 - Rôles et Permissions (5 points)

**US-1.2.1**: Rôles et Permissions  
**Estimation**: 5 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: Table Roles (id, name, permissions JSON)
- [ ] Backend: Middleware authorization (check permissions)
- [ ] Backend: Héritage permissions (dossier → documents)
- [ ] Frontend: Interface admin gestion rôles
- [ ] Tests: Unitaires permissions (100+ scénarios)

**Critères d'acceptation**:
```gherkin
Given je suis AGENT
When j'essaie de supprimer un dossier
Then je reçois une erreur 403 Forbidden
And l'action est loggée dans l'audit trail
```

---

### P1 - Audit Trail Complet (3 points)

**US-1.2.2**: Audit Trail Complet  
**Estimation**: 3 points  
**Dépendances**: Rôles et Permissions

**Tâches techniques**:
- [ ] Backend: Table AuditLogs (id, user_id, action, resource, ip, user_agent, timestamp)
- [ ] Backend: Middleware logging (toutes requêtes)
- [ ] Backend: Stockage append-only (pas de DELETE)
- [ ] Backend: API GET /api/audit (filtres, export CSV)
- [ ] Frontend: Interface consultation logs

**Critères d'acceptation**:
```gherkin
Given je suis admin
When je consulte l'audit trail
Then je vois toutes les actions des 3 derniers mois
And je peux filtrer par utilisateur, action, date
And je peux exporter en CSV pour audit externe
```

---

### P1 - Partage Sécurisé (3 points)

**US-1.2.3**: Partage Sécurisé  
**Estimation**: 3 points  
**Dépendances**: Documents Versionnés

**Tâches techniques**:
- [ ] Backend: Table ShareLinks (id, document_id, token, expires_at, password_hash, max_downloads)
- [ ] Backend: API POST /api/documents/{id}/share
- [ ] Backend: API GET /share/{token} (public, pas d'auth)
- [ ] Backend: Notifications à chaque accès
- [ ] Frontend: Modal génération lien

**Critères d'acceptation**:
```gherkin
Given j'ai un document "contrat.pdf"
When je génère un lien de partage avec expiration 7j
Then je reçois un lien unique https://memolib.com/share/abc123
And le destinataire peut télécharger sans compte
And je reçois une notification à chaque téléchargement
And le lien expire automatiquement après 7 jours
```

---

## 🔥 SPRINT 2 - Backlog Détaillé

### P1 - Calendrier Intégré (5 points)

**US-2.1.1**: Calendrier Intégré  
**Estimation**: 5 points  
**Dépendances**: Gestion Tâches

**Tâches techniques**:
- [ ] Backend: Table CalendarEvents (id, user_id, title, start, end, type, related_id)
- [ ] Backend: API GET /api/calendar (filtres: date, type)
- [ ] Frontend: Composant calendrier (react-big-calendar)
- [ ] Frontend: Vues mois/semaine/jour
- [ ] Frontend: Drag & drop pour reprogrammer

**Critères d'acceptation**:
```gherkin
Given j'ai 10 tâches avec échéances
When j'ouvre le calendrier
Then je vois toutes mes échéances en vue mois
And je peux drag & drop une tâche pour changer la date
And la tâche est mise à jour automatiquement
```

---

### P1 - Rappels Automatiques (3 points)

**US-2.1.2**: Rappels Automatiques  
**Estimation**: 3 points  
**Dépendances**: Calendrier Intégré

**Tâches techniques**:
- [ ] Backend: Job scheduler (Hangfire/Quartz)
- [ ] Backend: Service NotificationService (email, Telegram, in-app)
- [ ] Backend: Configuration rappels par utilisateur
- [ ] Backend: Snooze (1h, 1j)
- [ ] Frontend: Préférences notifications

**Critères d'acceptation**:
```gherkin
Given j'ai une tâche avec échéance dans 24h
When le job scheduler s'exécute
Then je reçois un email ET une notification Telegram
And je peux snooze pour 1h
And le rappel réapparaît dans 1h
```

---

### P1 - SLA par Type de Dossier (5 points)

**US-2.1.3**: SLA par Type de Dossier  
**Estimation**: 5 points  
**Dépendances**: Calendrier Intégré

**Tâches techniques**:
- [ ] Backend: Table SLAConfigs (id, case_type, response_time_hours, resolution_time_hours)
- [ ] Backend: Calcul SLA en temps réel
- [ ] Backend: Alertes si SLA en risque (>80% temps écoulé)
- [ ] Frontend: Dashboard SLA (% respectés, retards)
- [ ] Frontend: Configuration SLA par type

**Critères d'acceptation**:
```gherkin
Given un dossier "OQTF" avec SLA réponse 24h
When 20h se sont écoulées sans réponse
Then je reçois une alerte "SLA en risque"
And le dossier apparaît en rouge dans le dashboard
```

---

### P1 - Suivi Temps (5 points)

**US-2.2.1**: Suivi Temps  
**Estimation**: 5 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: Table TimeEntries (id, case_id, user_id, start, end, duration, description, category, rate)
- [ ] Backend: API POST /api/cases/{id}/time-entries
- [ ] Backend: Timer start/stop
- [ ] Frontend: Composant timer (start/stop/pause)
- [ ] Frontend: Saisie manuelle temps

**Critères d'acceptation**:
```gherkin
Given je travaille sur un dossier
When je démarre le timer
Then le temps s'incrémente en temps réel
When je stoppe le timer
Then une entrée de temps est créée avec durée exacte
And je peux éditer la description et catégorie
```

---

### P1 - Génération Préfacture (5 points)

**US-2.2.2**: Génération Préfacture  
**Estimation**: 5 points  
**Dépendances**: Suivi Temps

**Tâches techniques**:
- [ ] Backend: Table Invoices (id, case_id, status, items JSON, total, created_at)
- [ ] Backend: API POST /api/cases/{id}/invoices/draft
- [ ] Backend: Calcul auto: temps × taux horaire
- [ ] Frontend: Sélection période + dossier
- [ ] Frontend: Ajout frais manuels

**Critères d'acceptation**:
```gherkin
Given j'ai 10h de temps saisi sur un dossier
When je génère une préfacture
Then le montant est calculé automatiquement (10h × 150€ = 1500€)
And je peux ajouter des frais (déplacements, copies)
And je peux appliquer une remise de 10%
```

---

### P1 - Facture Finale (5 points)

**US-2.2.3**: Facture Finale  
**Estimation**: 5 points  
**Dépendances**: Génération Préfacture

**Tâches techniques**:
- [ ] Backend: Numérotation auto (FAC-2025-001)
- [ ] Backend: Génération PDF (iTextSharp/PuppeteerSharp)
- [ ] Backend: Mentions légales obligatoires
- [ ] Backend: API POST /api/invoices/{id}/finalize
- [ ] Frontend: Prévisualisation PDF

**Critères d'acceptation**:
```gherkin
Given j'ai une préfacture validée
When je la transforme en facture finale
Then un numéro unique est généré (FAC-2025-042)
And un PDF conforme est généré avec mentions légales
And la facture est envoyée par email au client
And le statut passe à "envoyée"
```

---

## 🔥 SPRINT 3 - Backlog Détaillé

### P1 - Moteur de Règles (8 points)

**US-3.1.1**: Moteur de Règles  
**Estimation**: 8 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: Table AutomationRules (id, name, trigger, conditions JSON, actions JSON, enabled)
- [ ] Backend: Rules engine (évaluation conditions)
- [ ] Backend: Exécution actions (créer tâche, assigner, notifier)
- [ ] Frontend: Interface no-code création règles
- [ ] Frontend: Logs exécution règles

**Critères d'acceptation**:
```gherkin
Given je crée une règle "Si email contient 'urgent' alors créer tâche P1"
When un email avec "urgent" arrive
Then une tâche priorité 1 est créée automatiquement
And je vois l'exécution dans les logs
```

---

### P1 - Assignation Automatique (5 points)

**US-3.1.2**: Assignation Automatique  
**Estimation**: 5 points  
**Dépendances**: Moteur de Règles

**Tâches techniques**:
- [ ] Backend: Algorithme round-robin
- [ ] Backend: Prise en compte charge actuelle
- [ ] Backend: Gestion absences/congés
- [ ] Backend: Réassignation si pas de réponse 24h
- [ ] Frontend: Dashboard charge par avocat

**Critères d'acceptation**:
```gherkin
Given 3 avocats disponibles avec charges: Jean (5), Marie (3), Paul (4)
When un nouveau dossier arrive
Then il est assigné à Marie (charge la plus faible)
And la charge de Marie passe à 4
```

---

### P1 - Relances Automatiques (3 points)

**US-3.1.3**: Relances Automatiques  
**Estimation**: 3 points  
**Dépendances**: Moteur de Règles

**Tâches techniques**:
- [ ] Backend: Templates relances (pièces, réponse, paiement)
- [ ] Backend: Job scheduler relances (J+3, J+7, J+14)
- [ ] Backend: Stop auto si réponse reçue
- [ ] Frontend: Configuration fréquence relances
- [ ] Frontend: Historique relances envoyées

**Critères d'acceptation**:
```gherkin
Given un client n'a pas fourni les pièces demandées
When 3 jours se sont écoulés
Then une relance automatique est envoyée
When le client répond
Then les relances suivantes sont annulées
```

---

### P1 - Dashboard Direction (5 points)

**US-3.2.1**: Dashboard Direction  
**Estimation**: 5 points  
**Dépendances**: Aucune

**Tâches techniques**:
- [ ] Backend: API GET /api/analytics/dashboard
- [ ] Backend: Calcul KPI (CA, marge, nb dossiers, taux occupation)
- [ ] Backend: Comparaison N-1
- [ ] Frontend: Composant dashboard (recharts)
- [ ] Frontend: Filtres (période, avocat, type)

**Critères d'acceptation**:
```gherkin
Given je suis directeur
When j'ouvre le dashboard
Then je vois le CA du mois en cours vs N-1
And je vois le nombre de dossiers actifs
And je vois le taux d'occupation par avocat
And je peux exporter en PDF
```

---

### P1 - Analyse Rentabilité (5 points)

**US-3.2.2**: Analyse Rentabilité  
**Estimation**: 5 points  
**Dépendances**: Dashboard Direction

**Tâches techniques**:
- [ ] Backend: Calcul marge par dossier (CA - coûts)
- [ ] Backend: Identification dossiers déficitaires
- [ ] Backend: Recommandations IA (augmenter taux, réduire temps)
- [ ] Frontend: Tableau rentabilité par dossier
- [ ] Frontend: Graphiques marge par avocat/type

**Critères d'acceptation**:
```gherkin
Given j'ai 50 dossiers clôturés
When j'ouvre l'analyse rentabilité
Then je vois la marge de chaque dossier
And les dossiers déficitaires sont en rouge
And je reçois des recommandations pour améliorer la marge
```

---

## 📊 Récapitulatif Backlog

### Sprint 1 (37 points)
- Timeline Unifiée: 5 pts
- Notes Contextuelles: 3 pts
- Gestion Tâches: 5 pts
- Documents Versionnés: 5 pts
- Inbox Multi-Canaux: 8 pts
- Rôles et Permissions: 5 pts
- Audit Trail: 3 pts
- Partage Sécurisé: 3 pts

### Sprint 2 (33 points)
- Calendrier Intégré: 5 pts
- Rappels Automatiques: 3 pts
- SLA par Type: 5 pts
- Suivi Temps: 5 pts
- Génération Préfacture: 5 pts
- Facture Finale: 5 pts
- Suivi Paiements: 5 pts (P2)

### Sprint 3 (34 points)
- Moteur de Règles: 8 pts
- Assignation Auto: 5 pts
- Relances Auto: 3 pts
- Workflows: 5 pts (P2)
- Dashboard Direction: 5 pts
- Analyse Rentabilité: 5 pts
- CSAT: 3 pts (P2)

**Total**: 104 points sur 8 semaines = **13 points/semaine** (vélocité cible)
