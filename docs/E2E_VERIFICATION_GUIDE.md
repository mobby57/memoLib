# Guide de Vérification End-to-End

## ✅ Système Complet Déployé

### Architecture

```
Email (Gmail) 
    ↓
Email Poller V2 (polling 60s)
    ↓
PostgreSQL Database
    ↓
Flask API v2 (REST)
    ↓
React Frontend
```

## 🚀 Démarrage du Système Complet

### 1. Backend API Server

```powershell
python backend/app_postgres.py
```

**URL:** http://localhost:5000/api/v2  
**Health:** http://localhost:5000/api/v2/health

### 2. Email Poller V2

```powershell
python scripts/start_email_poller_v2.py
```

**Fonctionnalités:**
- Polling IMAP toutes les 60s
- Création automatique de workspaces PostgreSQL
- User système: `email_system` (ID 200)

### 3. Frontend React

Déjà en cours sur: http://localhost:3000

**URL complète:** http://localhost:3000/workspaces

## 📧 Test End-to-End Manuel

### Étape 1: Envoyer un Email de Test

**À:** sarraboudjellal57@gmail.com  
**Sujet:** Test Workspace Automatique  
**Corps:** 
```
Ceci est un test du système email → workspace.

Ce message devrait créer automatiquement un workspace PostgreSQL.
```

### Étape 2: Attendre le Polling

Le poller V2 vérifie les emails toutes les 60 secondes.

**Logs à surveiller:**
```
🔄 Poll #X - HH:MM:SS
📬 X nouveau(x) email(s) trouvé(s)
📧 Email 1/X:
   De: expediteur@example.com
   Sujet: Test Workspace Automatique
   📁 Workspace PostgreSQL créé: Y
   💬 Message ajouté: #Z
   ✅ Email traité avec succès
```

### Étape 3: Vérifier dans le Frontend

1. Aller sur: http://localhost:3000/workspaces
2. Se connecter avec:
   - Username: `email_system`
   - Password: `EmailSystem2025!`

3. Vérifier que le workspace apparaît:
   - **Titre:** Sujet de l'email
   - **Source:** `email`
   - **Priorité:** AUTO (HIGH si "urgent", MEDIUM sinon)
   - **Messages:** Corps de l'email

### Étape 4: Vérifier via l'API

```powershell
# Login
$body = @{username="email_system"; password="EmailSystem2025!"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.user.token

# Lister les workspaces
$headers = @{Authorization="Bearer $token"}
$workspaces = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces" -Headers $headers
$workspaces.workspaces | Format-Table

# Voir les détails d'un workspace
$ws_id = $workspaces.workspaces[0].id
$workspace = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$ws_id" -Headers $headers
$workspace.workspace | Format-List

# Voir les messages
$messages = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/workspaces/$ws_id/messages" -Headers $headers
$messages.messages | Format-Table
```

## 🔍 Vérifications

### Backend API (Flask)

✅ Server running: http://localhost:5000  
✅ Health check: `GET /api/v2/health` → status=healthy  
✅ 12 endpoints opérationnels  
✅ JWT authentication fonctionnelle  

### Email Poller V2

✅ Polling IMAP actif (60s)  
✅ Utilisateur système créé: `email_system`  
✅ Connexion IMAP établie  
✅ Workspaces créés automatiquement  

### PostgreSQL Database

✅ Tables: users, workspaces, messages  
✅ Enums: WorkspaceStatus, WorkspacePriority, MessageRole  
✅ JSONB metadata pour email_data  

### Frontend React

✅ Page accessible: http://localhost:3000/workspaces  
✅ AuthPanel fonctionnel  
✅ WorkspaceManagerV2 affiche les workspaces  
✅ Messages expandables  
✅ Filtres (status, priority)  
✅ CRUD complet  

## 📊 Données de Test

### Workspace créé depuis email

```json
{
  "id": 192,
  "user_id": 200,
  "title": "Test Workspace Automatique",
  "source": "email",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "progress": 0.0,
  "workspace_metadata": {
    "email_data": {
      "from": "sender@example.com",
      "to": "sarraboudjellal57@gmail.com",
      "message_id": "<...>",
      "date": "2025-12-28 20:54:00",
      "has_attachments": false
    }
  },
  "created_at": "2025-12-28T20:54:05.123456",
  "updated_at": "2025-12-28T20:54:05.123456"
}
```

### Message associé

```json
{
  "id": 19,
  "workspace_id": 192,
  "role": "USER",
  "content": "Ceci est un test du système email → workspace...",
  "message_metadata": {
    "sender": "sender@example.com",
    "email_subject": "Test Workspace Automatique",
    "received_at": "2025-12-28 20:54:00"
  },
  "created_at": "2025-12-28T20:54:05.234567"
}
```

## 🐛 Troubleshooting

### Le workspace n'apparaît pas

1. **Vérifier le poller:**
   - Est-il démarré? Logs visibles?
   - Connexion IMAP OK?
   - Email bien reçu dans la boîte?

2. **Vérifier l'API:**
   - `GET /api/v2/health` → healthy?
   - `GET /api/v2/workspaces` (avec token) → workspaces listés?

3. **Vérifier le frontend:**
   - Token valide dans localStorage?
   - Console browser pour erreurs réseau?
   - User connecté = `email_system`?

### Erreur "Invalid token"

```powershell
# Re-login
$body = @{username="email_system"; password="EmailSystem2025!"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Le poller ne trouve pas d'emails

- Vérifier que l'email est bien UNREAD dans Gmail
- Vérifier les credentials IMAP dans `.env`
- Vérifier le firewall/réseau

## 📈 Statistiques

Après plusieurs emails traités:

```powershell
$stats = Invoke-RestMethod -Uri "http://localhost:5000/api/v2/stats" -Headers $headers
$stats.stats
```

**Résultat attendu:**
```json
{
  "total_workspaces": 5,
  "in_progress": 4,
  "completed": 1,
  "pending": 0,
  "total_messages": 10
}
```

## ✅ Checklist Complète

### Infrastructure
- [ ] PostgreSQL installé et configuré
- [ ] Python 3.11+ avec dépendances
- [ ] Node.js 18+ avec npm
- [ ] Gmail IMAP/SMTP activé

### Services
- [ ] Backend API démarré (port 5000)
- [ ] Frontend React démarré (port 3000)
- [ ] Email Poller V2 démarré (background)

### Tests
- [ ] Health check API → 200 OK
- [ ] Email envoyé → succès
- [ ] Poller détecte email → workspace créé
- [ ] Frontend affiche workspace → visible
- [ ] Messages visibles → corps email présent
- [ ] Metadata email → from/to/date corrects

### Résultat Final
- [ ] Email → Workspace (automatique)
- [ ] Workspace → API (accessible)
- [ ] API → Frontend (affiché)
- [ ] Full pipeline fonctionnel ✅

## 🎉 Succès!

Si tous les tests passent, le système est **100% opérationnel**:

1. ✅ Email reçu automatiquement
2. ✅ Workspace créé dans PostgreSQL
3. ✅ Accessible via API REST
4. ✅ Visible dans l'interface React
5. ✅ Messages stockés avec metadata
6. ✅ Authentification JWT sécurisée

**Prochaines étapes possibles:**
- Réponse automatique AI aux emails
- Catégorisation automatique (priorité, tags)
- Notifications en temps réel (WebSocket)
- Dashboard analytics
- Export PDF des conversations
