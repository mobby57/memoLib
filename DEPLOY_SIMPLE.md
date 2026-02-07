# 🚀 Déploiement MemoLib - Guide Simplifié

## ❌ Problème Actuel

Le projet a une structure complexe qui empêche le déploiement direct :
- `package.json` à la racine
- Code frontend dans `src/frontend`
- Fly.io/Vercel nécessitent une structure spécifique

## ✅ Solutions Rapides

### Option 1: Netlify (Le Plus Simple)

```bash
# Installer Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Déployer
cd src/frontend
netlify deploy --prod --dir=.next
```

### Option 2: Railway (Automatique)

1. Aller sur https://railway.app
2. Connecter GitHub
3. Sélectionner le repo
4. Railway détecte automatiquement Next.js
5. Déploiement automatique !

### Option 3: Render (Gratuit)

1. Aller sur https://render.com
2. New → Web Service
3. Connecter GitHub
4. Build Command: `cd src/frontend && npm install && npm run build`
5. Start Command: `cd src/frontend && npm start`

## 🎯 Recommandation

**Utilisez Railway** - C'est le plus simple et gratuit :
- Détection automatique
- Déploiement en 2 clics
- Logs en temps réel
- Domaine HTTPS gratuit

## 📝 Après le Déploiement

1. Notez l'URL (ex: https://memolib.up.railway.app)
2. Configurez les variables d'environnement
3. Testez l'application

---

**Temps estimé : 5 minutes avec Railway**
