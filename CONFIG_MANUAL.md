# 🔧 CONFIGURATION MANUELLE VERCEL

## 1. OUVRIR DASHBOARD
https://vercel.com/dashboard

## 2. SÉLECTIONNER PROJET
Cliquer sur: **iapostemanager**

## 3. ALLER DANS SETTINGS
Settings → Environment Variables

## 4. AJOUTER CES VARIABLES:

### SECRET_KEY
- Name: `SECRET_KEY`
- Value: `[GENERATE_NEW_SECRET_KEY]`
- Environment: Production ✓

### FLASK_ENV
- Name: `FLASK_ENV`
- Value: `production`
- Environment: Production ✓

### JWT_SECRET_KEY
- Name: `JWT_SECRET_KEY`
- Value: `[GENERATE_NEW_JWT_SECRET]`
- Environment: Production ✓

### FLASK_DEBUG
- Name: `FLASK_DEBUG`
- Value: `False`
- Environment: Production ✓

## 5. REDÉPLOYER
Deployments → Redeploy (latest)

## 6. ATTENDRE 2-3 MINUTES
Puis tester: https://iapostemanager.vercel.app

**FAIT MAINTENANT!**