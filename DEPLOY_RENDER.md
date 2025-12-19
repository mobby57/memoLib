# 🚀 Déploiement Render.com - Guide Complet

## 📋 Étapes de déploiement

### 1. Créer un compte Render.com
- Aller sur https://render.com
- Sign up with GitHub
- Connecter votre compte GitHub

### 2. Déployer l'application

#### Option A : Déploiement automatique (Recommandé)
1. **New Web Service** sur Render.com
2. **Connect GitHub** → Sélectionner `mobby57/iapm.com`
3. **Configuration :**
   ```
   Name: iapostemanager
   Environment: Python 3
   Build Command: ./build.sh
   Start Command: ./start.sh
   Plan: Free (0$/mois)
   ```

#### Option B : Déploiement manuel
1. **Fork le repo** sur votre GitHub personnel
2. **New Web Service** → Connect votre fork
3. Même configuration que ci-dessus

### 3. Variables d'environnement

Dans Render.com → Environment :
```
FLASK_ENV=production
SECRET_KEY=[auto-généré par Render]
DATABASE_URL=sqlite:///data/production.db
PORT=5000
```

### 4. Vérification

Une fois déployé :
```bash
# URL de votre app (exemple)
https://iapostemanager.onrender.com

# Health check
curl https://iapostemanager.onrender.com/api/health
```

## 🎯 Avantages Render.com

- ✅ **SSL/HTTPS automatique**
- ✅ **Déploiement automatique** (push → deploy)
- ✅ **Plan gratuit** disponible
- ✅ **Logs en temps réel**
- ✅ **Monitoring intégré**
- ✅ **Pas de configuration serveur**

## 📊 Limitations plan gratuit

- 🔄 **Sleep après 15min** d'inactivité
- ⏱️ **750h/mois** maximum
- 💾 **512MB RAM**
- 🌐 **Sous-domaine** .onrender.com

## 🔧 Troubleshooting

### Build échoue
```bash
# Vérifier les logs dans Render.com
# Problème fréquent : dépendances manquantes
```

### App ne démarre pas
```bash
# Vérifier start.sh
# Vérifier variables d'environnement
# Vérifier health check /api/health
```

### Performance lente
```bash
# Plan gratuit : upgrade vers plan payant ($7/mois)
# Optimiser le code Python
# Réduire les dépendances
```

## 🚀 Prochaines étapes

1. **Déployer** sur Render.com
2. **Tester** l'application en ligne
3. **Configurer** un nom de domaine personnalisé (optionnel)
4. **Monitorer** les performances

---

**🎉 Votre application sera accessible publiquement en 5 minutes !**