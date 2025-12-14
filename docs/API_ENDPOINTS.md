# API Endpoints Documentation - IAPosteManager v3.0

## 🔐 Authentication

### POST `/api/auth/login` ou `/api/login`
Authentification utilisateur
```json
Request: { "password": "string" }
Response: { "success": true, "token": "string", "redirect": "/" }
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
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_user": "user@gmail.com",
  "smtp_password": "app_password",
  "openai_key": "sk-..."
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
