# ✨ IAPosteManager v3.4 - Prêt à l'Emploi

## 🚀 Démarrage Ultra-Rapide

**Une seule commande :**

```powershell
.\DEMARRER.ps1
```

Puis ouvrir : **http://localhost:3001**

---

## 🎤 Nouvelle Fonctionnalité : Dictée Vocale

1. Cliquer sur **"🎤 Dicter avec validation"**
2. Parler dans votre microphone
3. Cliquer sur **"Améliorer"** pour que l'IA améliore le texte
4. **Valider** pour insérer dans l'email

---

## 📚 Documentation

- **`DEMARRAGE_RAPIDE.md`** - Guide complet
- **`docs/GUIDE_DICTEE_VOCALE.md`** - Mode dictée vocale
- **`docs/API_ENDPOINTS.md`** - 25+ endpoints API

---

## 🛠️ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `.\DEMARRER.ps1` | Démarre tout automatiquement |
| `.\start-backend.ps1` | Backend seul (port 5000) |
| `.\start-frontend.ps1` | Frontend seul (port 3001) |

---

## ✅ Fonctionnalités Principales

- ✅ Mode dictée vocale avec amélioration IA
- ✅ Envoi d'emails intelligent
- ✅ Génération par IA
- ✅ Envoi en lot (batch)
- ✅ Système d'accessibilité complet
- ✅ Dashboard unifié
- ✅ 39 tests E2E automatisés

---

## 🔧 Configuration Requise

Créer un fichier `.env` dans `src/backend/` :

```env
OPENAI_API_KEY=votre_cle_api
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_mot_de_passe_app
```

---

## 💡 Commandes Utiles

```powershell
# Démarrer
.\DEMARRER.ps1

# Tests
cd src\frontend
npx playwright test

# Arrêter
Get-Process python*,node* | Stop-Process -Force

# Health Check
Invoke-WebRequest http://localhost:5000/api/health
```

---

## 🎯 URLs

- **Application** : http://localhost:3001
- **API Backend** : http://localhost:5000
- **Health Check** : http://localhost:5000/api/health

---

**🎊 Votre application est prête ! Bon développement ! 🚀**
