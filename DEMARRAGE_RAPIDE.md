# 🚀 Démarrage Rapide - IAPosteManager v3.4

## ✅ Installation Terminée

Votre application IAPosteManager est **prête à l'emploi** avec toutes les fonctionnalités :

- ✅ Backend Flask avec 25+ endpoints API
- ✅ Frontend React avec interface moderne
- ✅ Mode dictée vocale avec validation
- ✅ Amélioration IA du texte dicté
- ✅ Envoi d'emails en lot (batch)
- ✅ Système d'accessibilité complet
- ✅ Base de données SQLite configurée

---

## 🎯 Démarrage en 3 Étapes

### 1. Démarrer le Backend (Port 5000)

```powershell
.\start-backend.ps1
```

**Ou manuellement :**
```powershell
cd src\backend
.\venv\Scripts\activate
python app.py
```

Le backend démarre sur : **http://localhost:5000**

### 2. Démarrer le Frontend (Port 3001)

```powershell
.\start-frontend.ps1
```

**Ou manuellement :**
```powershell
cd src\frontend
npm run dev
```

Le frontend démarre sur : **http://localhost:3001**

### 3. Ouvrir l'Application

🌐 Ouvrir votre navigateur sur : **http://localhost:3001**

---

## 🎤 Nouvelle Fonctionnalité : Dictée Vocale

### Comment l'utiliser

1. **Aller dans "Composer un email"**
2. **Cliquer sur le bouton "🎤 Dicter avec validation"**
3. **Parler dans votre microphone**
   - Votre texte s'affiche en temps réel
   - Vous pouvez le modifier manuellement
4. **Cliquer sur "Améliorer"**
   - L'IA améliore votre texte
   - Comparaison côte à côte
5. **Accepter ou Rejeter** les améliorations
6. **Valider** pour insérer dans l'email

### Exemple d'utilisation

```
🎤 Vous dites : "bonjour je veux envoyer un email pour dire que je serai absent demain"

✨ L'IA améliore : "Bonjour, Je vous informe de mon absence prévue pour demain. Cordialement."

✅ Vous validez et le texte s'insère dans votre email
```

📖 **Guide complet** : `docs/GUIDE_DICTEE_VOCALE.md`

---

## 📡 Endpoints API Disponibles

### 📧 Email
- `POST /api/send-email` - Envoyer un email
- `POST /api/email/send-batch` - Envoi en lot (max 100)
- `GET /api/email-history` - Historique

### 🤖 Intelligence Artificielle
- `POST /api/generate-email` - Générer email complet
- `POST /api/ai/improve-text` - Améliorer texte dicté
- `POST /api/ai/quick-generate` - Templates avec variables

### 🎙️ Voix
- `POST /api/transcribe` - Transcription audio
- `POST /api/speak` - Synthèse vocale (TTS)

### ♿ Accessibilité
- `GET /api/accessibility/settings` - Paramètres
- `GET /api/accessibility/shortcuts` - Raccourcis clavier
- `GET /api/accessibility/transcripts` - Historique transcriptions
- `GET/POST /api/accessibility/profile` - Profil utilisateur

### 📊 Monitoring
- `GET /api/health` - Santé du système (public)
- `GET /api/dashboard/stats` - Statistiques

📖 **Documentation complète** : `docs/API_ENDPOINTS.md`

---

## 🧪 Tests E2E

### Lancer tous les tests

```powershell
cd src\frontend
npx playwright test
```

### Lancer un fichier spécifique

```powershell
npx playwright test tests/e2e/accessibility.spec.js
```

### Voir le rapport HTML

```powershell
npx playwright show-report
```

### Tests disponibles (39 tests)

- ✅ **Accessibility System** (10 tests) - TTS, transcriptions, profils
- ✅ **Auth Helper** (3 tests) - Connexion, sessions
- ✅ **Debug Pages** (3 tests) - Navigation
- ✅ **Smoke Tests** (4 tests) - Backend, Frontend, Routes
- ✅ **User Journeys** (5+ tests) - Parcours utilisateur complets
- ✅ **Voice Transcription** - Dictée vocale

---

## 📁 Structure du Projet

```
iaPostemanage/
├── src/
│   ├── backend/          # Flask API (Python)
│   │   ├── app.py        # Application principale
│   │   ├── venv/         # Environnement virtuel Python
│   │   └── data/         # Base de données SQLite
│   └── frontend/         # React + Vite
│       ├── src/
│       │   ├── components/   # VoiceToTextEditor, etc.
│       │   ├── hooks/        # useVoiceInput, etc.
│       │   ├── pages/        # EmailComposer, etc.
│       │   └── services/     # API client
│       └── tests/e2e/    # Tests Playwright
├── docs/                 # Documentation
│   ├── API_ENDPOINTS.md
│   └── GUIDE_DICTEE_VOCALE.md
└── scripts/              # Scripts de démarrage
```

---

## 🔧 Commandes Utiles

### Backend

```powershell
# Arrêter le backend
Get-Process python* | Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id).LocalPort -eq 5000 } | Stop-Process -Force

# Voir les logs
Get-Content src\backend\logs\app.log -Tail 50

# Réinitialiser la base de données
Remove-Item src\backend\data\iapostemanager.db
```

### Frontend

```powershell
# Arrêter le frontend
Get-Process node* | Where-Object { (Get-NetTCPConnection -OwningProcess $_.Id).LocalPort -eq 3001 } | Stop-Process -Force

# Installer les dépendances
cd src\frontend
npm install

# Build de production
npm run build
```

---

## 🐛 Dépannage

### Backend ne démarre pas

```powershell
# Vérifier Python
python --version  # Doit être 3.11+

# Réactiver l'environnement virtuel
cd src\backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend ne démarre pas

```powershell
# Nettoyer et réinstaller
cd src\frontend
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

### Port déjà utilisé

```powershell
# Backend (5000)
netstat -ano | findstr :5000
Stop-Process -Id <PID> -Force

# Frontend (3001)
netstat -ano | findstr :3001
Stop-Process -Id <PID> -Force
```

---

## 🔐 Sécurité

### Variables d'environnement requises

Créer un fichier `.env` dans `src/backend/` :

```env
# OpenAI API
OPENAI_API_KEY=votre_cle_api

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app

# Flask
SECRET_KEY=une_cle_secrete_aleatoire_longue
FLASK_ENV=development
```

### Mot de passe Application Gmail

📖 Suivre le guide : `docs/GUIDE_APP_PASSWORD.md`

---

## 📊 État du Système

### Vérifier l'état complet

```powershell
# Script de diagnostic
.\DIAGNOSTIC.bat
```

### Health Check API

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
```

Réponse attendue :
```json
{
  "authenticated": false,
  "services": {
    "ai": "available",
    "email": "ready",
    "tts": "operational",
    "voice": "configured"
  },
  "status": "healthy",
  "timestamp": "2025-12-14T21:36:00Z",
  "version": "3.4.0"
}
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| `docs/API_ENDPOINTS.md` | Tous les endpoints avec exemples |
| `docs/GUIDE_DICTEE_VOCALE.md` | Mode dictée vocale détaillé |
| `docs/GUIDE_UTILISATEUR.md` | Guide utilisateur complet |
| `docs/GUIDE_ACCESSIBILITE_RAPIDE.md` | Fonctions d'accessibilité |
| `docs/DEVELOPPEMENT_GUIDE.md` | Guide développeur |

---

## 🎉 Fonctionnalités Principales

### 1. 📧 Envoi d'Emails Intelligent
- Génération par IA
- Templates personnalisables
- Envoi en lot (batch)
- Historique complet

### 2. 🎤 Dictée Vocale Avancée
- **Reconnaissance vocale en temps réel**
- **Prévisualisation avant envoi**
- **Amélioration par IA**
- **Modification manuelle possible**
- Support multilingue

### 3. ♿ Accessibilité Complète
- Mode Aveugle (TTS)
- Mode Sourd (Transcriptions)
- Mode Muet (Alternatives)
- Haut contraste
- Raccourcis clavier
- Tailles de police ajustables

### 4. 🤖 Intelligence Artificielle
- Génération d'emails
- Amélioration de texte
- Correction orthographique
- Suggestions de formulations

### 5. 📊 Dashboard Unifié
- Statistiques en temps réel
- Historique des emails
- Gestion des contacts
- Templates sauvegardés

---

## 🚀 Prochaines Étapes

1. **Configurer vos variables d'environnement** (`.env`)
2. **Créer votre premier email avec dictée vocale**
3. **Explorer les profils d'accessibilité**
4. **Consulter la documentation API**
5. **Personnaliser les templates**

---

## 💡 Astuces

- **Ctrl + /** : Afficher les raccourcis clavier
- **Ctrl + H** : Basculer haut contraste
- **Ctrl + T** : Activer/désactiver TTS
- **Tab** : Navigation au clavier
- **Esc** : Fermer les modals

---

## 📞 Support

Pour toute question ou problème :

1. Consulter les guides dans `docs/`
2. Vérifier les logs : `src/backend/logs/app.log`
3. Lancer le diagnostic : `.\DIAGNOSTIC.bat`

---

## ✨ Nouveautés v3.4

- ✅ Mode dictée vocale avec validation
- ✅ Amélioration IA du texte dicté
- ✅ Envoi d'emails en lot (batch)
- ✅ Historique des transcriptions vocales
- ✅ Profils d'accessibilité personnalisables
- ✅ 25+ endpoints API documentés
- ✅ 39 tests E2E automatisés
- ✅ Support multilingue amélioré

---

**🎯 Votre application est prête ! Bon développement ! 🚀**
