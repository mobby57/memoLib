# API Endpoints Documentation - IAPosteManager v3.0

## 🔐 Authentication

### POST `/api/auth/login` ou `/api/login`
Authentification utilisateur
```json
Request: { "password": "string" }
Response: { "success": true, "token": "<generated_token>", "redirect": "/" }
```

### POST `/api/auth/logout` ou `/api/logout`
Déconnexion
```json
Response: { "success": true }
```

## 📧 Email Management

### POST `/api/send-email`
Envoyer un email unique
```json
Request: {
  "to": "email@example.com",
  "subject": "Sujet",
  "body": "Corps du message"
}
Response: { "success": true }
```

### POST `/api/email/send-batch`
Envoyer plusieurs emails en lot (max 100)
```json
Request: {
  "emails": [
    { "to": "email1@example.com", "subject": "...", "body": "..." },
    { "to": "email2@example.com", "subject": "...", "body": "..." }
  ]
}
Response: {
  "success": true,
  "total": 2,
  "success_count": 2,
  "failed_count": 0,
  "results": [...]
}
```

### GET `/api/email-history?limit=50`
Historique des emails
```json
Response: {
  "success": true,
  "emails": [
    {
      "id": 1,
      "recipient": "email@example.com",
      "subject": "Sujet",
      "body": "Corps",
      "status": "sent",
      "created_at": "2025-12-14T10:00:00"
    }
  ]
}
```

## 🌐 Email Provisioning (Nouveau)

### POST `/api/email/check-availability`
Vérifier la disponibilité d'un nom d'utilisateur
```json
Request: {
  "username": "contact"
}
Response: {
  "available": true,
  "email": "contact@iapostemanager.com",
  "suggestions": ["contact1", "contact2", "contact-info"]
}
```

### POST `/api/email/create`
Créer une nouvelle adresse email générique
```json
Request: {
  "username": "contact",
  "display_name": "Support Client"
}
Response: {
  "success": true,
  "email": "contact@iapostemanager.com",
  "credentials": {
    "smtp_server": "smtp.sendgrid.net",
    "smtp_port": 587,
    "smtp_username": "contact",
    "smtp_password": "generated_password"
  },
  "message": "Email contact@iapostemanager.com créé avec succès!",
  "webmail": "https://app.sendgrid.com"
}
```

### GET `/api/email/my-accounts`
Liste des comptes email créés par l'utilisateur
```json
Response: {
  "accounts": [
    {
      "id": 1,
      "email": "contact@iapostemanager.com",
      "display_name": "Support Client",
      "status": "active",
      "created_at": "2025-12-16T10:00:00",
      "emails_sent_today": 5,
      "emails_sent_month": 150
    }
  ]
}
```

## 🤖 AI Services

### POST `/api/ai/generate`
Générer un email avec IA
```json
Request: {
  "prompt": "Demande de congé",
  "tone": "professional"
}
Response: {
  "success": true,
  "content": "Texte généré...",
  "source": "openai"
}
```

### POST `/api/generate-email`
Générer email complet (sujet + corps)
```json
Request: {
  "context": "Demander des informations",
  "tone": "professionnel",
  "emailType": "general"
}
Response: {
  "success": true,
  "subject": "Demande d'information",
  "body": "Bonjour,...",
  "source": "openai"
}
```

### POST `/api/ai/improve-text`
Améliorer un texte dicté
```json
Request: {
  "text": "je veux demander des infos",
  "tone": "professional",
  "context": "email",
  "language": "fr"
}
Response: {
  "success": true,
  "content": "Je souhaiterais obtenir des informations.",
  "text": "Je souhaiterais obtenir des informations.",
  "source": "openai",
  "original_length": 27,
  "improved_length": 45
}
```

### POST `/api/ai/quick-generate`
Génération rapide avec template
```json
Request: {
  "template": "Bonjour {nom}, votre commande {numero} est prête.",
  "variables": {
    "nom": "Jean",
    "numero": "12345"
  }
}
Response: {
  "success": true,
  "content": "Bonjour Jean, votre commande 12345 est prête.",
  "template": "...",
  "variables_used": ["nom", "numero"]
}
```

## 🎤 Voice Services

### POST `/api/voice/transcribe`
Transcrire audio en texte
```json
Request: { "audio_data": "base64..." }
Response: {
  "success": true,
  "text": "Transcription..."
}
```

### POST `/api/voice/speak`
Synthèse vocale (TTS)
```json
Request: {
  "text": "Texte à lire",
  "rate": 150,
  "volume": 0.9
}
Response: { "success": true }
```

## 📋 Templates

### GET `/api/templates`
Liste des templates
```json
Response: {
  "success": true,
  "templates": [
    {
      "id": 1,
      "name": "Demande congé",
      "subject": "Demande de congé",
      "body": "...",
      "category": "rh",
      "created_at": "..."
    }
  ]
}
```

### POST `/api/templates`
Créer un template
```json
Request: {
  "name": "Nouveau template",
  "subject": "Sujet",
  "body": "Corps",
  "category": "general"
}
Response: {
  "success": true,
  "template_id": 5,
  "message": "Template créé avec succès"
}
```

## 👥 Contacts

### GET `/api/contacts`
Liste des contacts
```json
Response: {
  "success": true,
  "contacts": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "organization": "Entreprise",
      "category": "client",
      "created_at": "..."
    }
  ]
}
```

### POST `/api/contacts`
Créer un contact
```json
Request: {
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "organization": "Entreprise",
  "category": "client"
}
Response: {
  "success": true,
  "contact_id": 10,
  "message": "Contact créé avec succès"
}
```

### DELETE `/api/contacts/{id}`
Supprimer un contact
```json
Response: {
  "success": true,
  "message": "Contact supprimé avec succès"
}
```

## ♿ Accessibility

### GET `/api/accessibility/settings`
Récupérer paramètres d'accessibilité
```json
Response: {
  "success": true,
  "settings": {
    "high_contrast": false,
    "large_text": false,
    "screen_reader": false,
    "keyboard_navigation": true
  }
}
```

### POST `/api/accessibility/settings`
Mettre à jour paramètres
```json
Request: {
  "high_contrast": true,
  "large_text": true
}
Response: {
  "success": true,
  "message": "Paramètres mis à jour"
}
```

### GET `/api/accessibility/shortcuts`
Liste des raccourcis clavier
```json
Response: {
  "success": true,
  "shortcuts": [
    { "key": "Ctrl+N", "action": "Nouvel email" },
    { "key": "Ctrl+S", "action": "Envoyer" },
    { "key": "Ctrl+D", "action": "Dictée vocale" }
  ]
}
```

## ⚙️ Configuration

### GET `/api/config/settings`
Récupérer configuration
```json
Response: {
  "success": true,
  "settings": {
    "smtp_configured": true,
    "openai_configured": false
  }
}
```

### POST `/api/config/settings`
Mettre à jour configuration
```json
Request: {
  "setting_name": "value"
}
Response: {
  "success": true,
  "message": "Configuration mise à jour"
}
```

## 📊 Dashboard

### GET `/api/dashboard/stats`
Statistiques du tableau de bord
```json
Response: {
  "success": true,
  "stats": {
    "total_emails": 125,
    "today_emails": 5,
    "success_rate": 95.5,
    "total_contacts": 50,
    "recent_activity": [...]
  }
}
```

## 🏥 Health Check

### GET `/api/health`
État du serveur (non authentifié)
```json
Response: {
  "status": "healthy",
  "version": "3.0",
  "timestamp": "2025-12-14T10:00:00",
  "authenticated": false,
  "services": {
    "database": true,
    "email": true,
    "voice": true,
    "ai": true
  }
}
```

## 📝 Credentials Management

### GET `/api/credentials`
Récupérer credentials (chiffrés)
```json
Response: {
  "success": true,
  "smtp_configured": true,
  "openai_configured": false
}
```

### POST `/api/credentials`
Sauvegarder credentials
```json
Request: {
  "smtp_host": "<smtp_server>",
  "smtp_port": 587,
  "smtp_user": "<email_address>",
  "smtp_password": "<app_password>",
  "openai_key": "<openai_api_key>"
}
Response: {
  "success": true,
  "message": "Credentials sauvegardés"
}
```

## 🔗 Aliases (Compatibilité)

Les endpoints suivants sont des alias pour compatibilité :
- `/api/email/send` → `/api/send-email`
- `/api/email/history` → `/api/email-history`

## 🔒 Authentification Requise

Tous les endpoints sauf les suivants nécessitent une authentification :
- POST `/api/auth/login`
- GET `/api/health`
- GET `/api/templates` (version publique)

## ⚠️ Gestion des Erreurs

Toutes les erreurs retournent :
```json
{
  "success": false,
  "error": "Message d'erreur",
  "code": "ERROR_CODE"
}
```

Codes HTTP :
- `200` : Succès
- `400` : Validation error
- `401` : Non authentifié
- `404` : Route non trouvée
- `500` : Erreur serveur

## 🚀 Utilisation

Base URL : `http://localhost:5000/api`

### Exemple avec fetch :
```javascript
const response = await fetch('http://localhost:5000/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'destinataire@example.com',
    subject: 'Test Email',
    body: 'Contenu du message'
  })
});

const result = await response.json();
console.log(result);
```

## 🔄 Webhooks

### POST `/api/webhooks/email-status`
Webhook pour statut d'email (externe)
```json
Request: {
  "email_id": "12345",
  "status": "delivered",
  "timestamp": "2025-12-14T10:00:00",
  "recipient": "user@example.com"
}
Response: { "success": true }
```

### GET `/api/webhooks/list`
Liste des webhooks configurés
```json
Response: {
  "success": true,
  "webhooks": [
    {
      "id": 1,
      "url": "https://example.com/webhook",
      "events": ["email.sent", "email.failed"],
      "active": true
    }
  ]
}
```

## 📈 Analytics

### GET `/api/analytics/overview`
Vue d'ensemble des analytics
```json
Response: {
  "success": true,
  "data": {
    "total_emails": 1247,
    "success_rate": 96.8,
    "avg_response_time": 145,
    "top_recipients": [...],
    "email_trends": {
      "daily": [12, 15, 8, 22, 18],
      "weekly": [89, 102, 95, 134]
    }
  }
}
```

### GET `/api/analytics/performance`
Métriques de performance
```json
Response: {
  "success": true,
  "metrics": {
    "response_time": 145,
    "throughput": 2847,
    "error_rate": 0.03,
    "availability": 99.97,
    "cache_hit_rate": 94.2,
    "active_users": 156
  }
}
```

## 🔍 Search & Filtering

### GET `/api/search/emails?q=query&limit=20`
Recherche dans les emails
```json
Response: {
  "success": true,
  "results": [
    {
      "id": 1,
      "subject": "Matching subject",
      "recipient": "user@example.com",
      "relevance": 0.95
    }
  ],
  "total": 5,
  "query": "query"
}
```

### GET `/api/search/contacts?q=name&category=client`
Recherche dans les contacts
```json
Response: {
  "success": true,
  "results": [...],
  "filters_applied": ["category=client"]
}
```

## 🔐 Security

### POST `/api/security/2fa/enable`
Activer l'authentification 2FA
```json
Request: {
  "phone": "+33123456789"
}
Response: {
  "success": true,
  "qr_code": "data:image/png;base64,...",
  "backup_codes": ["123456", "789012"]
}
```

### POST `/api/security/audit-log`
Journal d'audit
```json
Response: {
  "success": true,
  "logs": [
    {
      "timestamp": "2025-12-14T10:00:00",
      "action": "email.sent",
      "user": "admin",
      "ip": "192.168.1.1",
      "details": {...}
    }
  ]
}
```

## 🌍 Internationalization

### GET `/api/i18n/languages`
Langues disponibles
```json
Response: {
  "success": true,
  "languages": [
    { "code": "fr", "name": "Français", "flag": "🇫🇷" },
    { "code": "en", "name": "English", "flag": "🇺🇸" },
    { "code": "es", "name": "Español", "flag": "🇪🇸" }
  ]
}
```

### GET `/api/i18n/translations/{lang}`
Traductions pour une langue
```json
Response: {
  "success": true,
  "translations": {
    "common.save": "Sauvegarder",
    "common.cancel": "Annuler",
    "email.subject": "Sujet"
  }
}
```

## 📱 Mobile API

### GET `/api/mobile/sync`
Synchronisation mobile
```json
Response: {
  "success": true,
  "last_sync": "2025-12-14T10:00:00",
  "updates": {
    "emails": 5,
    "contacts": 2,
    "templates": 1
  }
}
```

### POST `/api/mobile/push-token`
Enregistrer token push
```json
Request: {
  "token": "firebase_token_here",
  "platform": "android"
}
Response: { "success": true }
```

## 🔄 Batch Operations

### POST `/api/batch/contacts/import`
Import en lot de contacts
```json
Request: {
  "contacts": [
    { "name": "Jean", "email": "jean@example.com" },
    { "name": "Marie", "email": "marie@example.com" }
  ]
}
Response: {
  "success": true,
  "imported": 2,
  "failed": 0,
  "errors": []
}
```

### POST `/api/batch/emails/schedule`
Planifier plusieurs emails
```json
Request: {
  "emails": [...],
  "schedule_time": "2025-12-15T09:00:00"
}
Response: {
  "success": true,
  "scheduled_count": 10,
  "job_id": "batch_123"
}
```

## 🎯 AI Advanced

### POST `/api/ai/analyze-sentiment`
Analyse de sentiment
```json
Request: {
  "text": "Je suis très satisfait de votre service"
}
Response: {
  "success": true,
  "sentiment": "positive",
  "confidence": 0.95,
  "emotions": {
    "joy": 0.8,
    "satisfaction": 0.9
  }
}
```

### POST `/api/ai/suggest-improvements`
Suggestions d'amélioration
```json
Request: {
  "text": "Votre email text here",
  "context": "professional"
}
Response: {
  "success": true,
  "suggestions": [
    {
      "type": "tone",
      "original": "Salut",
      "suggested": "Bonjour",
      "reason": "Plus professionnel"
    }
  ]
}
```

## 📊 Reporting

### GET `/api/reports/email-performance`
Rapport de performance emails
```json
Response: {
  "success": true,
  "report": {
    "period": "last_30_days",
    "total_sent": 1247,
    "delivery_rate": 98.5,
    "open_rate": 24.3,
    "click_rate": 3.2,
    "bounce_rate": 1.5,
    "top_performing": [...]
  }
}
```

### POST `/api/reports/generate`
Générer rapport personnalisé
```json
Request: {
  "type": "email_analytics",
  "date_range": {
    "start": "2025-12-01",
    "end": "2025-12-14"
  },
  "format": "pdf"
}
Response: {
  "success": true,
  "report_id": "rpt_123",
  "download_url": "/api/reports/download/rpt_123"
}
```

## 🔧 System Administration

### GET `/api/admin/system-info`
Informations système
```json
Response: {
  "success": true,
  "system": {
    "version": "3.0.0",
    "uptime": "7d 14h 32m",
    "memory_usage": 245,
    "cpu_usage": 23,
    "disk_usage": 1.2,
    "active_connections": 156
  }
}
```

### POST `/api/admin/backup`
Créer sauvegarde
```json
Response: {
  "success": true,
  "backup_id": "backup_20251214",
  "size": "2.4MB",
  "created_at": "2025-12-14T10:00:00"
}
```

### GET `/api/admin/logs?level=error&limit=100`
Logs système
```json
Response: {
  "success": true,
  "logs": [
    {
      "timestamp": "2025-12-14T10:00:00",
      "level": "error",
      "message": "SMTP connection failed",
      "context": {...}
    }
  ]
}
```

## 🔌 Plugin System

### GET `/api/plugins/available`
Plugins disponibles
```json
Response: {
  "success": true,
  "plugins": [
    {
      "id": "gmail-integration",
      "name": "Gmail Integration",
      "version": "1.0.0",
      "description": "Intégration Gmail avancée",
      "installed": false
    }
  ]
}
```

### POST `/api/plugins/{id}/install`
Installer plugin
```json
Response: {
  "success": true,
  "message": "Plugin installé avec succès",
  "requires_restart": false
}
```

## 🎨 Themes & Customization

### GET `/api/themes/available`
Thèmes disponibles
```json
Response: {
  "success": true,
  "themes": [
    {
      "id": "dark-pro",
      "name": "Dark Professional",
      "preview": "data:image/png;base64,...",
      "active": false
    }
  ]
}
```

### POST `/api/themes/apply`
Appliquer thème
```json
Request: {
  "theme_id": "dark-pro",
  "custom_colors": {
    "primary": "#6366f1",
    "secondary": "#8b5cf6"
  }
}
Response: { "success": true }
```

---

## 📚 Documentation Complète

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: Bearer token ou session
- **Rate Limiting**: 1000 req/hour par IP
- **Pagination**: `?page=1&limit=50`
- **Sorting**: `?sort=created_at&order=desc`
- **Filtering**: `?filter[status]=sent&filter[date]=today`

## 🚀 SDK & Libraries

```javascript
// JavaScript SDK
import { IAPosteManager } from '@iapostemanager/sdk';

const client = new IAPosteManager({
  baseUrl: 'http://localhost:5000/api',
  apiKey: 'your-api-key'
});

// Envoyer email
await client.emails.send({
  to: 'user@example.com',
  subject: 'Test',
  body: 'Hello World'
});
```

```python
# Python SDK
from iapostemanager import Client

client = Client(
    base_url='http://localhost:5000/api',
    api_key='your-api-key'
)

# Envoyer email
client.emails.send(
    to='user@example.com',
    subject='Test',
    body='Hello World'
)
```ify({
    to: 'destinataire@example.com',
    subject: 'Test',
    body: 'Contenu du message'
  })
});

const data = await response.json();
console.log(data);
```

### Avec le service API frontend :
```javascript
import { emailAPI } from './services/api';

const result = await emailAPI.send({
  to: 'destinataire@example.com',
  subject: 'Test',
  body: 'Contenu du message'
});
```
