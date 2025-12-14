# IAPosteManager v2.2 - Mode React + API

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend API
```bash
# Terminal 1
DEMARRER_REACT.bat
# ou
python backend_api.py
```
**Backend API:** http://127.0.0.1:5000

### 2. Démarrer le Frontend React
```bash
# Terminal 2
cd frontend-react
DEMARRER_FRONTEND.bat
# ou
npm install && npm run dev
```
**Frontend React:** http://127.0.0.1:3001

## 📡 Architecture

```
Frontend React (Port 3001)
    ↓ API Calls
Backend Flask (Port 5000)
    ↓ Data
SQLite Database + Encrypted Files
```

## 🔌 Endpoints API Disponibles

### Authentification
- `POST /api/login` - Connexion
- `GET /api/check-credentials` - Vérifier credentials

### Configuration
- `POST /api/save-gmail` - Sauvegarder Gmail
- `POST /api/save-openai` - Sauvegarder OpenAI

### Emails
- `POST /api/send-email` - Envoyer email
- `POST /api/generate-email` - Générer avec IA
- `GET /api/email-history` - Historique

### Templates & Contacts
- `GET /api/templates` - Lister templates
- `POST /api/templates` - Créer template
- `GET /api/contacts` - Lister contacts

## 🎯 Fonctionnalités React

### Pages Disponibles
- **Dashboard** - Vue d'ensemble
- **SendEmail** - Envoi d'emails
- **AIGenerate** - Génération IA
- **Templates** - Gestion templates
- **Contacts** - Gestion contacts
- **Configuration** - Paramètres
- **History** - Historique
- **Accessibility** - Accessibilité

### Composants
- **Layout** - Structure principale
- **Header** - Navigation
- **Sidebar** - Menu latéral
- **AccessibilityPanel** - Panneau accessibilité

## ⚙️ Configuration

### Proxy Vite (déjà configuré)
```js
// vite.config.js
server: {
  port: 3001,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    }
  }
}
```

### CORS Backend (déjà configuré)
```python
CORS(app, origins=["http://localhost:3001"])
```

## 🔧 Développement

### Structure Frontend
```
frontend-react/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── pages/         # Pages de l'application
│   ├── services/      # API calls
│   ├── store/         # État global (Zustand)
│   └── App.jsx        # App principale
├── package.json
└── vite.config.js
```

### API Service
```js
import { emailAPI } from './services/api';

// Envoyer un email
const result = await emailAPI.send({
  recipient: 'test@example.com',
  subject: 'Test',
  body: 'Message'
});
```

## 🎨 Interface

- **Design:** Tailwind CSS + Framer Motion
- **Icons:** Lucide React
- **Charts:** Chart.js + React Chart.js 2
- **Notifications:** React Hot Toast
- **Routing:** React Router DOM

## 🚀 Avantages du Mode React

1. **Interface moderne** - UI/UX optimisée
2. **Réactivité** - Temps réel avec WebSocket
3. **Performance** - SPA rapide
4. **Accessibilité** - Support complet
5. **Mobile** - Responsive design
6. **Tests E2E** - Playwright intégré

## 📱 Utilisation

1. Ouvrir http://127.0.0.1:3001
2. Se connecter avec mot de passe maître
3. Configurer Gmail/OpenAI si nécessaire
4. Utiliser l'interface React moderne

**L'application React est prête !** 🎉