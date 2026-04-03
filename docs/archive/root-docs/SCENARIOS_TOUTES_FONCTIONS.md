# 🎯 SCÉNARIOS DÉTAILLÉS - TOUTES LES 12 FONCTIONNALITÉS

**Date:** 27 Février 2025  
**Objectif:** Test exhaustif de chaque fonctionnalité avec toutes les étapes

---

## 🚀 EXÉCUTION RAPIDE

```powershell
# Test automatique de toutes les fonctionnalités
.\scripts\test-all-features.ps1

# Avec URL personnalisée
.\scripts\test-all-features.ps1 -ApiUrl "http://localhost:8091"
```

---

## 📋 TABLE DES FONCTIONNALITÉS

1. [Ingestion Email](#1-ingestion-email)
2. [Notes de Dossier](#2-notes-de-dossier)
3. [Tâches (TODO)](#3-tâches-todo)
4. [Documents](#4-documents)
5. [Appels Téléphoniques](#5-appels-téléphoniques)
6. [Formulaires Personnalisés](#6-formulaires-personnalisés)
7. [Automatisations](#7-automatisations)
8. [Rapports](#8-rapports)
9. [Intégrations](#9-intégrations)
10. [Messagerie Équipe](#10-messagerie-équipe)
11. [Partage Externe](#11-partage-externe)
12. [Gestion Dossier Complète](#12-gestion-dossier-complète)

---

## 1. INGESTION EMAIL

### Objectif
Recevoir un email et créer automatiquement un dossier + client avec extraction des coordonnées.

### Étapes Détaillées

#### Étape 1.1: Envoi Email
```http
POST /api/ingest/email
Content-Type: application/json

{
  "from": "marie.dubois@example.com",
  "to": "cabinet@avocat.com",
  "subject": "URGENT - Demande divorce",
  "body": "Bonjour Maître,\n\nJe souhaite entamer une procédure de divorce...\n\nMarie Dubois\n06 12 34 56 78\n15 rue de la Paix, 75001 Paris",
  "receivedAt": "2025-02-27T14:30:00Z"
}
```

#### Étape 1.2: Vérification Dossier Créé
```http
GET /api/cases
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ 1 dossier créé automatiquement
- ✅ Titre: "Demande divorce - Marie Dubois"
- ✅ Statut: OPEN
- ✅ 1 événement dans la timeline

#### Étape 1.3: Vérification Client Créé
```http
GET /api/client
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ 1 client créé: Marie Dubois
- ✅ Email: marie.dubois@example.com
- ✅ Téléphone: 06 12 34 56 78 (extrait automatiquement)
- ✅ Adresse: 15 rue de la Paix, 75001 Paris (extrait automatiquement)

#### Étape 1.4: Timeline du Dossier
```http
GET /api/cases/{caseId}/timeline
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ 1 événement: EMAIL_RECEIVED
- ✅ Contenu complet de l'email
- ✅ Date/heure de réception

---

## 2. NOTES DE DOSSIER

### Objectif
Ajouter des notes internes avec mentions (@) pour notifier des collègues.

### Étapes Détaillées

#### Étape 2.1: Création Note avec @mention
```http
POST /api/case-notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "content": "Dossier urgent à traiter. @avocat-senior merci de prendre en charge.",
  "mentions": ["avocat-senior"]
}
```

**Résultat attendu:**
- ✅ Note créée avec ID
- ✅ @mention enregistrée
- ✅ Notification envoyée à @avocat-senior

#### Étape 2.2: Liste Notes du Dossier
```http
GET /api/case-notes/case/{caseId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste de toutes les notes
- ✅ Triées par date (plus récente en premier)
- ✅ Mentions visibles

#### Étape 2.3: Modification Note
```http
PUT /api/case-notes/{noteId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Dossier urgent TRAITÉ. @avocat-senior a pris en charge.",
  "mentions": ["avocat-senior"]
}
```

**Résultat attendu:**
- ✅ Note mise à jour
- ✅ UpdatedAt modifié
- ✅ Historique conservé

#### Étape 2.4: Suppression Note
```http
DELETE /api/case-notes/{noteId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Note supprimée
- ✅ 204 No Content

---

## 3. TÂCHES (TODO)

### Objectif
Créer des tâches avec priorités, échéances et assignation.

### Étapes Détaillées

#### Étape 3.1: Création Tâche Prioritaire
```http
POST /api/case-tasks
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "title": "Préparer dossier divorce",
  "description": "Rassembler tous les documents nécessaires",
  "priority": 5,
  "dueDate": "2025-03-05T23:59:59Z",
  "assignedTo": "{userId}"
}
```

**Résultat attendu:**
- ✅ Tâche créée
- ✅ Priorité: 5 (Urgent)
- ✅ Échéance: 5 mars 2025
- ✅ Assignée à l'utilisateur

#### Étape 3.2: Liste Tâches du Dossier
```http
GET /api/case-tasks/case/{caseId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste des tâches
- ✅ Triées par priorité puis échéance
- ✅ Statut visible (TODO/DONE)

#### Étape 3.3: Marquer Tâche Complétée
```http
PATCH /api/case-tasks/{taskId}/complete
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ IsCompleted = true
- ✅ CompletedAt = date actuelle
- ✅ Notification envoyée

#### Étape 3.4: Suppression Tâche
```http
DELETE /api/case-tasks/{taskId}
Authorization: Bearer {token}
```

---

## 4. DOCUMENTS

### Objectif
Upload, versioning et téléchargement sécurisé de documents.

### Étapes Détaillées

#### Étape 4.1: Upload Document
```http
POST /api/case-documents/upload/{caseId}
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [fichier.pdf]
```

**Résultat attendu:**
- ✅ Document uploadé
- ✅ Stocké dans uploads/documents/
- ✅ Métadonnées enregistrées (nom, taille, type)
- ✅ Version 1

#### Étape 4.2: Liste Documents du Dossier
```http
GET /api/case-documents/case/{caseId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste des documents
- ✅ Informations: nom, taille, date, version

#### Étape 4.3: Téléchargement Document
```http
GET /api/case-documents/{documentId}/download
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Fichier téléchargé
- ✅ Content-Type correct
- ✅ Content-Disposition avec nom original

#### Étape 4.4: Nouvelle Version
```http
POST /api/case-documents/{documentId}/version
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [fichier_v2.pdf]
```

**Résultat attendu:**
- ✅ Version 2 créée
- ✅ Version 1 conservée
- ✅ Historique des versions

---

## 5. APPELS TÉLÉPHONIQUES

### Objectif
Logger les appels avec durée, direction et transcription.

### Étapes Détaillées

#### Étape 5.1: Démarrage Appel
```http
POST /api/phone-calls
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "phoneNumber": "0612345678",
  "direction": "INBOUND",
  "notes": "Client très inquiet"
}
```

**Résultat attendu:**
- ✅ Appel créé
- ✅ StartTime = maintenant
- ✅ Status = IN_PROGRESS

#### Étape 5.2: Fin Appel
```http
PATCH /api/phone-calls/{callId}/end
Authorization: Bearer {token}
Content-Type: application/json

{
  "durationSeconds": 300
}
```

**Résultat attendu:**
- ✅ EndTime = maintenant
- ✅ Duration = 300 secondes (5 minutes)
- ✅ Status = COMPLETED

#### Étape 5.3: Ajout Transcription
```http
PATCH /api/phone-calls/{callId}/transcription
Authorization: Bearer {token}
Content-Type: application/json

{
  "transcription": "Client: Bonjour Maître...\nAvocat: Je comprends..."
}
```

**Résultat attendu:**
- ✅ Transcription enregistrée
- ✅ Searchable dans la recherche globale

#### Étape 5.4: Liste Appels du Dossier
```http
GET /api/phone-calls/case/{caseId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste des appels
- ✅ Triés par date (plus récent en premier)
- ✅ Durée totale calculée

---

## 6. FORMULAIRES PERSONNALISÉS

### Objectif
Créer des formulaires dynamiques pour collecter des informations clients.

### Étapes Détaillées

#### Étape 6.1: Création Formulaire
```http
POST /api/custom-forms
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Questionnaire Divorce",
  "description": "Collecte d'informations",
  "fields": [
    {
      "name": "situation",
      "label": "Situation matrimoniale",
      "type": "SELECT",
      "required": true,
      "options": ["Marié", "Pacsé"]
    },
    {
      "name": "enfants",
      "label": "Nombre d'enfants",
      "type": "NUMBER",
      "required": true
    }
  ],
  "isActive": true
}
```

**Résultat attendu:**
- ✅ Formulaire créé
- ✅ 2 champs configurés
- ✅ Actif et prêt à recevoir soumissions

#### Étape 6.2: Accès Public Formulaire
```http
GET /api/custom-forms/{formId}/public
```

**Résultat attendu:**
- ✅ Formulaire accessible sans auth
- ✅ Structure complète retournée
- ✅ Prêt pour affichage frontend

#### Étape 6.3: Soumission Formulaire
```http
POST /api/custom-forms/{formId}/submit
Content-Type: application/json

{
  "responses": {
    "situation": "Marié",
    "enfants": "2"
  }
}
```

**Résultat attendu:**
- ✅ Soumission enregistrée
- ✅ Validation des champs requis
- ✅ ID de soumission retourné

#### Étape 6.4: Liste Soumissions
```http
GET /api/custom-forms/{formId}/submissions
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste des soumissions
- ✅ Réponses complètes
- ✅ Date de soumission

#### Étape 6.5: Désactivation Formulaire
```http
PATCH /api/custom-forms/{formId}/toggle
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ IsActive = false
- ✅ Plus accessible publiquement

---

## 7. AUTOMATISATIONS

### Objectif
Créer des règles automatiques (triggers → actions).

### Étapes Détaillées

#### Étape 7.1: Création Règle
```http
POST /api/automations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Alerte dossier urgent",
  "description": "Notifier si email contient URGENT",
  "triggerType": "EMAIL_RECEIVED",
  "conditions": {
    "subject_contains": "URGENT"
  },
  "actionType": "SET_PRIORITY",
  "actionParams": {
    "priority": "5"
  },
  "isActive": true
}
```

**Résultat attendu:**
- ✅ Automatisation créée
- ✅ Active immédiatement
- ✅ Prête à s'exécuter

#### Étape 7.2: Test Automatisation
```http
POST /api/ingest/email
Content-Type: application/json

{
  "from": "test@example.com",
  "to": "cabinet@avocat.com",
  "subject": "URGENT - Test",
  "body": "Test automatisation"
}
```

**Résultat attendu:**
- ✅ Email ingéré
- ✅ Automatisation déclenchée
- ✅ Priorité = 5 automatiquement

#### Étape 7.3: Liste Automatisations
```http
GET /api/automations
Authorization: Bearer {token}
```

#### Étape 7.4: Désactivation
```http
PATCH /api/automations/{automationId}/toggle
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ IsActive = false
- ✅ Ne s'exécute plus

---

## 8. RAPPORTS

### Objectif
Générer des rapports analytics (temps, revenus, statuts).

### Étapes Détaillées

#### Étape 8.1: Rapport Temps par Dossier
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Temps par dossier - Février 2025",
  "reportType": "TIME_BY_CASE",
  "filters": {
    "startDate": "2025-02-01T00:00:00Z",
    "endDate": "2025-02-28T23:59:59Z"
  }
}
```

**Résultat attendu:**
- ✅ Rapport généré
- ✅ Data: liste des dossiers avec temps passé
- ✅ Trié par temps décroissant

#### Étape 8.2: Rapport Revenus par Client
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Revenus Q1 2025",
  "reportType": "REVENUE_BY_CLIENT",
  "filters": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-03-31T23:59:59Z"
  }
}
```

**Résultat attendu:**
- ✅ Rapport généré
- ✅ Data: clients avec CA généré
- ✅ Total calculé

#### Étape 8.3: Rapport Statuts Dossiers
```http
POST /api/reports/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Statuts dossiers",
  "reportType": "CASE_STATUS",
  "filters": {}
}
```

**Résultat attendu:**
- ✅ Répartition: OPEN, IN_PROGRESS, CLOSED
- ✅ Pourcentages calculés

#### Étape 8.4: Liste Rapports
```http
GET /api/reports
Authorization: Bearer {token}
```

---

## 9. INTÉGRATIONS

### Objectif
Connecter des services tiers (Slack, Zapier, etc.).

### Étapes Détaillées

#### Étape 9.1: Configuration Slack
```http
POST /api/integrations
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Slack Notifications",
  "serviceType": "SLACK",
  "settings": {
    "webhook_url": "https://hooks.slack.com/services/XXX",
    "channel": "#legal-alerts"
  },
  "isActive": true
}
```

**Résultat attendu:**
- ✅ Intégration créée
- ✅ Settings stockés en JSON
- ✅ Active

#### Étape 9.2: Test Connexion
```http
POST /api/integrations/{integrationId}/refresh
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ LastSyncAt mis à jour
- ✅ Connexion testée

#### Étape 9.3: Liste Intégrations
```http
GET /api/integrations
Authorization: Bearer {token}
```

#### Étape 9.4: Désactivation
```http
PATCH /api/integrations/{integrationId}/toggle
Authorization: Bearer {token}
```

---

## 10. MESSAGERIE ÉQUIPE

### Objectif
Chat interne entre membres de l'équipe sur un dossier.

### Étapes Détaillées

#### Étape 10.1: Envoi Message
```http
POST /api/team-messages
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "recipientId": "{userId}",
  "content": "Nouveau dossier urgent à traiter"
}
```

**Résultat attendu:**
- ✅ Message envoyé
- ✅ IsRead = false
- ✅ Notification envoyée

#### Étape 10.2: Messages Non Lus
```http
GET /api/team-messages/unread
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste messages non lus
- ✅ Triés par date

#### Étape 10.3: Marquer Lu
```http
PATCH /api/team-messages/{messageId}/read
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ IsRead = true
- ✅ ReadAt = maintenant

#### Étape 10.4: Conversations
```http
GET /api/team-messages/conversations
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Liste conversations groupées
- ✅ Dernier message visible

---

## 11. PARTAGE EXTERNE

### Objectif
Créer des liens sécurisés pour partager avec clients externes.

### Étapes Détaillées

#### Étape 11.1: Création Partage
```http
POST /api/external-share
Authorization: Bearer {token}
Content-Type: application/json

{
  "caseId": "{caseId}",
  "documentIds": [],
  "expiresAt": "2025-03-07T23:59:59Z",
  "password": "SecurePass123",
  "maxDownloads": 3
}
```

**Résultat attendu:**
- ✅ Partage créé
- ✅ Token généré (UUID)
- ✅ URL: /api/external-share/{token}

#### Étape 11.2: Accès Public (sans auth)
```http
GET /api/external-share/{token}
```

**Résultat attendu:**
- ✅ Informations du partage
- ✅ Demande mot de passe si défini

#### Étape 11.3: Téléchargement Document
```http
GET /api/external-share/{token}/download/{documentId}?password=SecurePass123
```

**Résultat attendu:**
- ✅ Document téléchargé
- ✅ AccessCount incrémenté
- ✅ Bloqué si maxDownloads atteint

#### Étape 11.4: Liste Partages du Dossier
```http
GET /api/external-share/case/{caseId}
Authorization: Bearer {token}
```

#### Étape 11.5: Révocation
```http
DELETE /api/external-share/{shareId}
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Partage supprimé
- ✅ Lien invalide immédiatement

---

## 12. GESTION DOSSIER COMPLÈTE

### Objectif
Workflow complet d'un dossier de A à Z.

### Étapes Détaillées

#### Étape 12.1: Récupération Détails
```http
GET /api/cases/{caseId}
Authorization: Bearer {token}
```

#### Étape 12.2: Ajout Tags
```http
PATCH /api/cases/{caseId}/tags
Authorization: Bearer {token}
Content-Type: application/json

{
  "tags": ["divorce", "urgent", "famille"]
}
```

#### Étape 12.3: Définition Priorité
```http
PATCH /api/cases/{caseId}/priority
Authorization: Bearer {token}
Content-Type: application/json

{
  "priority": 5,
  "dueDate": "2025-03-07T23:59:59Z"
}
```

#### Étape 12.4: Assignation
```http
PATCH /api/cases/{caseId}/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignedTo": "{userId}"
}
```

#### Étape 12.5: Changement Statut
```http
PATCH /api/cases/{caseId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

#### Étape 12.6: Timeline Complète
```http
GET /api/cases/{caseId}/timeline
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Tous les événements chronologiques
- ✅ Emails, notes, tâches, appels, etc.
- ✅ Triés par date

#### Étape 12.7: Filtres Avancés
```http
GET /api/cases/filter?status=IN_PROGRESS&priority=5&tags=urgent
Authorization: Bearer {token}
```

**Résultat attendu:**
- ✅ Dossiers filtrés
- ✅ Combinaison de critères

---

## 📊 MÉTRIQUES DE SUCCÈS

Après exécution complète:

### Données Créées
- ✅ 1 utilisateur
- ✅ 1 dossier
- ✅ 1 client
- ✅ 1+ notes
- ✅ 1+ tâches
- ✅ 1+ documents
- ✅ 1+ appels
- ✅ 1 formulaire + soumissions
- ✅ 1+ automatisations
- ✅ 1+ rapports
- ✅ 1+ intégrations
- ✅ 1+ messages
- ✅ 1+ partages

### Performance
- ✅ Toutes les requêtes < 500ms
- ✅ Aucune erreur 500
- ✅ Authentification OK
- ✅ Isolation multi-tenant OK

---

## 🎯 COMMANDES RAPIDES

```powershell
# Test complet automatique
.\scripts\test-all-features.ps1

# Test avec URL personnalisée
.\scripts\test-all-features.ps1 -ApiUrl "http://localhost:8091"

# Vérifier résultats
start http://localhost:5078/demo-pro.html
```

---

**✅ FIN DE LA DOCUMENTATION**
