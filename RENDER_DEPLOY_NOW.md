# 🚀 Déployer iaPosteManager sur Render.com

## ⚡ Déploiement automatique (recommandé)

Votre projet contient maintenant un fichier `render.yaml` qui configure automatiquement tout !

### 1️⃣ Créer un compte Render
```
https://render.com
```
- Cliquez **"Get Started for Free"**
- **Sign up with GitHub**
- Autorisez Render à accéder à vos repositories

### 2️⃣ Déployer via Dashboard

**Méthode A : Blueprint (automatique - recommandé)**
1. Dashboard → **New** → **Blueprint**
2. Connectez votre repo : `mobby57/iapm.com`
3. Render détectera automatiquement `render.yaml`
4. Cliquez **"Apply"**
5. ✅ Tout est configuré automatiquement !

**Méthode B : Web Service (manuel)**
1. Dashboard → **New** → **Web Service**
2. Connectez votre repo : `mobby57/iapm.com`
3. Configuration :
   ```
   Name:             iapostemanager
   Region:           Frankfurt (EU Central)
   Branch:           main
   Runtime:          Python 3
   Build Command:    bash build.sh
   Start Command:    bash start.sh
   ```

### 3️⃣ Variables d'environnement (auto-configurées)

Via `render.yaml`, ces variables sont déjà définies :
- ✅ `FLASK_ENV=production`
- ✅ `PORT=10000`
- ✅ `SECRET_KEY` (auto-généré)
- ✅ `DATABASE_URL=sqlite:///data/production.db`
- ✅ `PYTHONUNBUFFERED=1`

**Variables additionnelles à ajouter manuellement** (si besoin) :
```
Environment → Add Environment Variable

# Email (si vous voulez l'envoi d'emails)
SENDGRID_API_KEY=SG.votre_cle_api
SENDGRID_FROM_EMAIL=noreply@votre-domaine.com

# OU Gmail
GMAIL_USER=votre-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### 4️⃣ Disque persistant (inclus dans render.yaml)

Le fichier `render.yaml` configure automatiquement :
- 📦 **Disque persistant** : 1 GB gratuit
- 📂 **Mount path** : `/opt/render/project/src/backend/data`
- 💾 **Base de données** : Sauvegardée entre déploiements

### 5️⃣ Attendre le déploiement

⏱️ **Temps estimé** : 3-5 minutes

Vous verrez les logs en temps réel :
```
📦 Installation des dépendances Python...
✅ Dépendances installées!
🚀 Démarrage de l'application...
✅ Application démarrée sur le port 10000
```

### 6️⃣ Tester l'application

Votre app sera accessible sur :
```
https://iapostemanager.onrender.com
```

**Test du health endpoint :**
```powershell
# PowerShell
Invoke-WebRequest -Uri "https://iapostemanager.onrender.com/api/health" -UseBasicParsing

# Ou dans le navigateur
start https://iapostemanager.onrender.com
```

```bash
# Linux/Mac
curl https://iapostemanager.onrender.com/api/health
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "version": "3.0",
  "timestamp": "2025-12-19T...",
  "services": {
    "database": true,
    "email": true,
    "voice": true,
    "ai": false
  }
}
```

---

## 🔧 Plan gratuit Render

✅ **Free Tier inclus :**
- 750 heures/mois (suffisant pour un projet 24/7)
- 512 MB RAM
- 0.1 CPU
- 1 GB disque persistant
- SSL automatique
- Domaine `.onrender.com`
- Auto-deploy on push

⚠️ **Limitations :**
- Application en veille après 15 min d'inactivité (redémarre automatiquement)
- Peut prendre 30-60 secondes pour le premier chargement après veille

💡 **Upgrade vers Starter ($7/mois) :**
- Pas de veille automatique
- 512 MB RAM
- Domaine personnalisé
- Support prioritaire

---

## 📊 Monitoring et logs

### Via Dashboard Render
1. Dashboard → Votre service → **Logs**
2. Logs en temps réel
3. Filtrer par niveau (INFO, WARNING, ERROR)

### Via Shell
1. Dashboard → Votre service → **Shell**
2. Accès terminal dans le conteneur
```bash
# Vérifier les logs
tail -f logs/app.log

# Vérifier la base de données
sqlite3 data/production.db "SELECT COUNT(*) FROM users;"

# Vérifier l'espace disque
df -h
```

### Métriques
- Dashboard → Votre service → **Metrics**
- CPU, RAM, Network, Requests
- Graphiques interactifs

---

## 🔄 Déploiement automatique (CD)

Le `render.yaml` configure `autoDeploy: true` :
- ✅ Chaque push sur `main` déclenche un déploiement automatique
- ⏱️ Déploiement en ~3-5 minutes
- 🔔 Notifications email en cas d'échec

**Workflow :**
```
git commit -m "feat: nouvelle fonctionnalité"
git push origin main
   ↓
Render détecte le push
   ↓
Build automatique (build.sh)
   ↓
Tests (optionnel)
   ↓
Déploiement (start.sh)
   ↓
Health check (/api/health)
   ↓
✅ En production !
```

---

## 🌐 Domaine personnalisé (optionnel)

### 1. Ajouter un domaine
1. Dashboard → Votre service → **Settings** → **Custom Domains**
2. **Add Custom Domain**
3. Entrez votre domaine : `app.votre-domaine.com`

### 2. Configurer DNS
Ajoutez un enregistrement CNAME chez votre registrar :
```
Type:  CNAME
Name:  app (ou @)
Value: iapostemanager.onrender.com
TTL:   3600
```

### 3. SSL automatique
Render génère automatiquement un certificat Let's Encrypt (gratuit)

---

## 🐛 Dépannage

### Erreur : "Application failed to start"
```bash
# Vérifier les logs
Dashboard → Logs

# Erreur commune : Port incorrect
# Solution : Vérifier que app.py utilise os.environ.get('PORT', 5000)
```

### Erreur : "Build failed"
```bash
# Vérifier requirements.txt
# S'assurer que toutes les dépendances sont listées

# Tester localement
pip install -r requirements.txt
python src/backend/app.py
```

### Erreur : "Database not found"
```bash
# Vérifier que le disque persistant est bien configuré
Dashboard → Settings → Disks

# Recréer la base
Dashboard → Shell
cd data
rm production.db
python -c "from app import db; db.create_all()"
```

### Application en veille (Free Tier)
```bash
# Utiliser un service de ping (optionnel)
# UptimeRobot : https://uptimerobot.com/
# Configure un ping toutes les 5 minutes vers /api/health

# Ou upgrader vers Starter plan ($7/mois)
```

---

## 📚 Fichiers de configuration créés

Votre projet contient maintenant :

1. **`render.yaml`** - Configuration Blueprint Render
   - Service web
   - Variables d'environnement
   - Disque persistant
   - Health checks
   - Auto-deploy

2. **`build.sh`** - Script de build optimisé
   - Installation dépendances
   - Création dossiers
   - Permissions

3. **`start.sh`** - Script de démarrage
   - Configuration variables
   - Initialisation DB
   - Lancement Flask

---

## ✅ Checklist de déploiement

- [ ] Compte Render créé et connecté à GitHub
- [ ] Repository `mobby57/iapm.com` accessible
- [ ] Fichiers `render.yaml`, `build.sh`, `start.sh` commitées
- [ ] Variables d'environnement configurées (si email/API keys)
- [ ] Service créé via Blueprint ou Web Service
- [ ] Déploiement terminé (logs verts)
- [ ] Health check OK : https://iapostemanager.onrender.com/api/health
- [ ] Application accessible et fonctionnelle
- [ ] (Optionnel) Domaine personnalisé configuré
- [ ] (Optionnel) Monitoring et alertes configurés

---

## 🎉 Félicitations !

Votre application **iaPosteManager** est maintenant déployée sur Render !

**URL de production :** https://iapostemanager.onrender.com

**Prochaines étapes :**
1. Configurer un domaine personnalisé
2. Ajouter des variables d'environnement pour l'email
3. Configurer le monitoring UptimeRobot (éviter la veille)
4. Tester toutes les fonctionnalités en production
5. Inviter des utilisateurs à tester

---

*Guide créé le 19 décembre 2025*  
*Version 2.0 - Avec render.yaml et scripts optimisés*  
*iaPosteManager - Gestionnaire d'emails intelligent*