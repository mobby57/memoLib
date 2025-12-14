# 🚀 IAPosteManager v2.2 - Production Ready

Application web complète pour automatiser l'envoi d'emails avec génération IA, interface vocale et sécurité avancée.

## ✅ Status: Production Ready
- **39/39 tests E2E Playwright** ✅
- **Frontend React + Vite** ✅  
- **Backend Flask unifié** ✅
- **Interface d'accessibilité complète** ✅
- **Chiffrement AES-256** ✅
- **API REST documentée** ✅

## 🌐 Déploiement

### Option 1: Render (Recommandé)
1. Fork ce repo
2. Connecter à [render.com](https://render.com)
3. Build: `./build.sh`
4. Start: `./start.sh`

### Option 2: Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Local
```bash
python src/backend/app.py
```

## 🎯 Fonctionnalités

- 📧 **Envoi emails** (Gmail, Outlook, SMTP)
- 🤖 **Génération IA** (OpenAI GPT)
- 🎤 **Interface vocale** (TTS, reconnaissance)
- ♿ **Accessibilité** (profils Aveugle/Sourd/Muet)
- 🔐 **Sécurité** (chiffrement AES-256)
- 📊 **Analytics** (statistiques, historique)
- 🌐 **API REST** (endpoints documentés)

## 🏗️ Architecture

```
Frontend React (port 3001) ↔ Backend Flask (port 5000)
├── Services API unifiés
├── Base SQLite chiffrée  
├── Tests E2E Playwright
└── Configurations déploiement
```

## 📱 URLs
- **Frontend:** http://localhost:3001
- **Backend:** http://localhost:5000
- **API:** http://localhost:5000/api

---
**Ready for production deployment! 🎉**