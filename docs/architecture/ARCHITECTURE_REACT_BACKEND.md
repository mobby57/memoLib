# 🏗️ Architecture React + Backend Intégré

## 🎯 Structure Cible

```
iaPostemanage/
├── frontend/                    # React App Principal
│   ├── src/
│   │   ├── components/         # Composants React
│   │   ├── pages/             # Pages principales
│   │   ├── services/          # API calls
│   │   └── App.jsx            # App principale
│   └── package.json
├── backend/                    # API Backend
│   ├── api/                   # Routes API
│   ├── controllers/           # Logique métier
│   ├── services/              # Services intégrés
│   └── main.py               # Serveur principal
└── docker-compose.yml         # Orchestration
```

## ⚡ Backend Unifié

### Services Intégrés
- **Email Service** (SMTP, templates)
- **AI Service** (OpenAI, génération)
- **Voice Service** (TTS, reconnaissance)
- **Auth Service** (JWT, sessions)
- **Accessibility Service** (interface adaptée)

### API Endpoints
```
/api/auth/login
/api/email/send
/api/ai/generate
/api/voice/transcribe
/api/accessibility/speak
```

## 🎨 Frontend React

### Composants Principaux
- **Dashboard** - Vue d'ensemble
- **EmailComposer** - Création emails
- **VoiceInterface** - Interface vocale
- **AccessibilityPanel** - Outils accessibilité
- **SettingsPanel** - Configuration

### Services Frontend
```javascript
// services/api.js
export const emailService = {
  send: (data) => fetch('/api/email/send', {...}),
  getHistory: () => fetch('/api/email/history')
};

export const aiService = {
  generate: (prompt) => fetch('/api/ai/generate', {...})
};
```

## 🔧 Intégration

### Docker Compose
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite:///app.db
```

### Proxy Configuration
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
}
```