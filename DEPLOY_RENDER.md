# 🚀 Déploiement sur Render.com

## ✅ Fichiers créés pour Render

- `render.yaml` - Configuration de déploiement
- `requirements.txt` - Dépendances Python

## 📋 Étapes de déploiement

### 1️⃣ Pousser sur GitHub

```powershell
# Si pas encore fait
.\PUSH_GITHUB.bat
```

### 2️⃣ Créer compte Render

1. Aller sur: https://render.com
2. "Get Started" → "Sign up with GitHub"
3. Autoriser l'accès à vos repositories

### 3️⃣ Connecter le repository

1. Dashboard Render → "New +"
2. "Web Service"
3. "Connect a repository"
4. Sélectionner: `mooby865/iapostemanager`
5. Cliquer "Connect"

### 4️⃣ Configuration automatique

Render détectera automatiquement le `render.yaml` et configurera:

- ✅ **Name:** iapostemanager
- ✅ **Environment:** Python
- ✅ **Build Command:** `pip install -r requirements.txt`
- ✅ **Start Command:** `python src/backend/app.py`
- ✅ **Plan:** Free

### 5️⃣ Variables d'environnement (optionnelles)

Si besoin, ajouter dans Render Dashboard:

```
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG....
GMAIL_USERNAME=votre@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 6️⃣ Déployer

1. Cliquer "Create Web Service"
2. Render va automatiquement:
   - Cloner votre repo
   - Installer les dépendances
   - Démarrer l'application
   - Générer une URL publique

## 🌐 URL de l'application

Une fois déployé, votre app sera accessible sur:
```
https://iapostemanager.onrender.com
```

## 🔄 Auto-déploiement

À chaque push sur GitHub, Render redéploiera automatiquement!

## 📊 Monitoring

Dashboard Render affiche:
- ✅ Logs en temps réel
- ✅ Métriques de performance
- ✅ Status de santé
- ✅ Historique des déploiements

## 🆓 Plan gratuit Render

**Inclus:**
- 750 heures/mois
- SSL automatique
- Auto-déploiement GitHub
- Logs et métriques

**Limitations:**
- Application "dort" après 15min d'inactivité
- Réveil en ~30 secondes au premier accès
- 1 service web gratuit

## 🚨 Dépannage

### Build échoue
```bash
# Vérifier requirements.txt
pip install -r requirements.txt
```

### App ne démarre pas
```bash
# Vérifier que app.py existe
ls src/backend/app.py
```

### Port incorrect
```python
# Dans app.py, utiliser PORT de l'environnement
import os
port = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=port)
```

## 🔧 Commandes utiles

**Voir les logs:**
- Dashboard Render → Votre service → "Logs"

**Redéployer manuellement:**
- Dashboard → "Manual Deploy" → "Deploy latest commit"

**Changer la configuration:**
- Modifier `render.yaml`
- Push sur GitHub
- Redéploiement automatique

---

**🎉 Votre application sera accessible publiquement sur Internet!**