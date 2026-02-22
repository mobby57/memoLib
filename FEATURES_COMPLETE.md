# 🚀 MemoLib - Toutes les Fonctionnalités

## ✅ Fonctionnalités Implémentées

### 1. **Workflow de Statut des Dossiers**
- **Statuts**: OPEN, IN_PROGRESS, CLOSED
- **API**: `PATCH /api/cases/{caseId}/status`
```json
{ "status": "IN_PROGRESS" }
```

### 2. **Attribution de Dossiers**
- Assigner un dossier à un utilisateur
- **API**: `PATCH /api/cases/{caseId}/assign`
```json
{ "assignedToUserId": "guid-here" }
```

### 3. **Tags et Catégorisation**
- Tags multiples par dossier
- **API**: `PATCH /api/cases/{caseId}/tags`
```json
{ "tags": ["urgent", "famille", "divorce"] }
```

### 4. **Priorités et Échéances**
- Priorité numérique (0-5)
- Date d'échéance
- **API**: `PATCH /api/cases/{caseId}/priority`
```json
{ "priority": 3, "dueDate": "2025-12-31T23:59:59Z" }
```

### 5. **Filtres Avancés**
- Filtrer par statut, tag, priorité
- **API**: `GET /api/cases/filter?status=OPEN&tag=urgent&priority=3`

### 6. **Templates d'Emails**
- Créer des modèles réutilisables
- **API Créer**: `POST /api/email/templates`
```json
{
  "name": "Réponse standard",
  "subject": "Re: Votre dossier",
  "body": "Bonjour,\n\nVotre dossier est en cours..."
}
```
- **API Lister**: `GET /api/email/templates`

### 7. **Envoi d'Emails**
- Envoyer des emails depuis l'application
- **API**: `POST /api/email/send`
```json
{
  "to": "client@example.com",
  "subject": "Mise à jour dossier",
  "body": "Votre dossier avance bien..."
}
```

### 8. **Pièces Jointes**
- Upload de fichiers par événement
- **API Upload**: `POST /api/attachment/upload/{eventId}` (multipart/form-data)
- **API Download**: `GET /api/attachment/{attachmentId}`
- **API Liste**: `GET /api/attachment/event/{eventId}`

## 📊 Modèle de Données Enrichi

### Case (Dossier)
```csharp
{
  "id": "guid",
  "userId": "guid",
  "clientId": "guid",
  "title": "string",
  "status": "OPEN|IN_PROGRESS|CLOSED",
  "assignedToUserId": "guid?",
  "tags": "tag1,tag2,tag3",
  "priority": 0-5,
  "dueDate": "datetime?",
  "closedAt": "datetime?",
  "createdAt": "datetime"
}
```

### EmailTemplate
```csharp
{
  "id": "guid",
  "userId": "guid",
  "name": "string",
  "subject": "string",
  "body": "string",
  "createdAt": "datetime"
}
```

### Attachment
```csharp
{
  "id": "guid",
  "eventId": "guid",
  "fileName": "string",
  "contentType": "string",
  "fileSize": 123456,
  "filePath": "string",
  "uploadedAt": "datetime"
}
```

## 🎯 Exemples d'Utilisation

### Workflow Complet d'un Dossier

```bash
# 1. Créer un dossier (existant)
POST /api/cases
{ "title": "Divorce Martin" }

# 2. Définir la priorité
PATCH /api/cases/{id}/priority
{ "priority": 4, "dueDate": "2025-06-30" }

# 3. Ajouter des tags
PATCH /api/cases/{id}/tags
{ "tags": ["urgent", "famille", "divorce"] }

# 4. Passer en cours
PATCH /api/cases/{id}/status
{ "status": "IN_PROGRESS" }

# 5. Assigner à un avocat
PATCH /api/cases/{id}/assign
{ "assignedToUserId": "guid" }

# 6. Envoyer un email au client
POST /api/email/send
{
  "to": "client@example.com",
  "subject": "Votre dossier avance",
  "body": "Nous avons bien progressé..."
}

# 7. Clôturer le dossier
PATCH /api/cases/{id}/status
{ "status": "CLOSED" }
```

### Gestion des Templates

```bash
# Créer un template
POST /api/email/templates
{
  "name": "Première réponse",
  "subject": "Accusé de réception",
  "body": "Nous avons bien reçu votre demande..."
}

# Lister les templates
GET /api/email/templates

# Utiliser un template pour envoyer
POST /api/email/send
{
  "to": "client@example.com",
  "subject": "[Template Subject]",
  "body": "[Template Body]"
}
```

### Gestion des Pièces Jointes

```bash
# Upload un fichier
POST /api/attachment/upload/{eventId}
Content-Type: multipart/form-data
file: [binary]

# Lister les pièces jointes d'un email
GET /api/attachment/event/{eventId}

# Télécharger une pièce jointe
GET /api/attachment/{attachmentId}
```

## 🔍 Filtres et Recherche

```bash
# Tous les dossiers ouverts
GET /api/cases/filter?status=OPEN

# Dossiers urgents
GET /api/cases/filter?tag=urgent

# Dossiers priorité haute
GET /api/cases/filter?priority=4

# Combinaison
GET /api/cases/filter?status=IN_PROGRESS&tag=famille&priority=3
```

## 📝 Configuration SMTP (appsettings.json)

```json
{
  "EmailMonitor": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "Username": "votre-email@gmail.com",
    "Password": "mot-de-passe-application"
  }
}
```

## 🚀 Installation

```powershell
# Exécuter le script de mise à jour
.\update-all.ps1
```

## 📦 Stockage

- **Base de données**: SQLite (memolib.db)
- **Pièces jointes**: Dossier `uploads/` (créé automatiquement)

## 🔐 Sécurité

- Toutes les API nécessitent authentification JWT
- Les fichiers sont stockés avec des noms uniques (GUID)
- Validation des types de fichiers
- Isolation par utilisateur

## 🎨 Interface Utilisateur (À venir)

Les fonctionnalités suivantes seront ajoutées à demo.html:
- Boutons de changement de statut
- Sélecteur de tags
- Slider de priorité
- Formulaire d'envoi d'email
- Sélecteur de templates
- Upload de pièces jointes
- Filtres visuels

## 📊 Statistiques Enrichies

Nouvelles métriques disponibles:
- Dossiers par statut
- Dossiers par priorité
- Dossiers par tag
- Temps moyen de traitement
- Taux de clôture
- Emails envoyés

## 🔄 Prochaines Étapes

1. ✅ Migration de base de données
2. ✅ API complètes
3. ⏳ Interface utilisateur enrichie
4. ⏳ Notifications temps réel (SignalR)
5. ⏳ Rapports PDF
6. ⏳ Export Excel
7. ⏳ Calendrier intégré
8. ⏳ Recherche full-text avancée

## 💡 Notes

- **Pas besoin d'Azure** pour l'instant (tout en local)
- **Performance**: Optimisé pour 1000+ dossiers
- **Scalabilité**: Prêt pour multi-utilisateurs
- **Backup**: Sauvegarder memolib.db et uploads/
