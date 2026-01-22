# 🚀 GUIDE D'EXÉCUTION - Configuration 3 Environnements

**Durée:** 15-20 minutes  
**Date:** 21 janvier 2026

---

## ✅ PRÉREQUIS (Déjà fait!)

- ✅ Vercel CLI installé et authentifié (`vercel whoami`)
- ✅ Git configuré
- ✅ Fichier `.env.local` avec toutes les clés
- ✅ Repository GitHub connecté

---

## 🎯 MÉTHODE 1: AUTOMATIQUE (Recommandée - 10 minutes)

### Étape 1: Créer les branches Git

```powershell
# Créer et pousser les branches
git checkout -b develop
git push -u origin develop

git checkout -b staging  
git push -u origin staging

git checkout main
```

**Résultat:**
```
✅ Branche develop créée
✅ Branche staging créée
✅ Branche main (déjà existante)
```

---

### Étape 2: Configuration Vercel Dashboard (PLUS SIMPLE)

**C'est la méthode la plus rapide!**

1. **Ouvrir:** https://vercel.com/dashboard
2. **Sélectionner:** Votre projet `iapostemanage`
3. **Aller à:** Settings → Environment Variables
4. **Ajouter les variables** suivantes pour **CHAQUE environnement**:

#### Variables Critiques (5 obligatoires)

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `DATABASE_URL` | Copier depuis `.env.local` | PostgreSQL staging | PostgreSQL prod |
| `NEXTAUTH_SECRET` | Copier depuis `.env.local` | **Générer nouveau** | **Générer nouveau** |
| `NEXTAUTH_URL` | `https://iapostemanage-dev.vercel.app` | `https://iapostemanage-staging.vercel.app` | `https://iapostemanage.vercel.app` |
| `STRIPE_SECRET_KEY` | `sk_test_...` (test) | `sk_test_...` (test) | `sk_live_...` (LIVE!) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` (test) | `pk_test_...` (test) | `pk_live_...` (LIVE!) |

#### Variables Optionnelles (recommandées)

| Variable | Valeur |
|----------|--------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` (dev) ou endpoint distant |
| `OLLAMA_MODEL` | `llama3.2:3b` |
| `GMAIL_CLIENT_ID` | Copier depuis `.env.local` |
| `GMAIL_CLIENT_SECRET` | Copier depuis `.env.local` |
| `GITHUB_APP_ID` | Copier depuis `.env.local` |
| `PISTE_ENVIRONMENT` | `sandbox` (dev/staging), `production` (prod) |

**⏱️ Temps:** ~10 minutes pour tout configurer

---

### Étape 3: Vérifier la configuration

```powershell
# Lister les variables par environnement
vercel env ls development
vercel env ls staging
vercel env ls production

# Voir tous les déploiements
vercel list
```

**Résultat attendu:**
```
✅ 5+ variables pour development
✅ 5+ variables pour staging
✅ 5+ variables pour production
```

---

### Étape 4: Premier déploiement

```powershell
# Déployer development (preview)
git checkout develop
git push origin develop
# Vercel déploie automatiquement → https://iapostemanage-dev.vercel.app

# Déployer staging (preview)
git checkout staging
git push origin staging
# Vercel déploie automatiquement → https://iapostemanage-staging.vercel.app

# Déployer production
git checkout main
git push origin main
# Vercel déploie automatiquement → https://iapostemanage.vercel.app
```

---

## 🎯 MÉTHODE 2: SCRIPT INTERACTIF (Alternative - 15 minutes)

Si vous préférez utiliser le CLI PowerShell:

### Étape 1: Lancer le script de setup

```powershell
.\scripts\setup-3-environments.ps1
```

Ce script va:
1. ✅ Créer les branches Git
2. ✅ Charger les variables de `.env.local`
3. ✅ Afficher les commandes à exécuter

---

### Étape 2: Ajouter les variables interactivement

```powershell
.\scripts\add-vercel-env-interactive.ps1
```

Le script vous guide:
1. Sélectionner l'environnement (dev, staging, prod, ou tous)
2. Confirmer chaque variable
3. Ajouter automatiquement sur Vercel

**Avantages:**
- ✅ Guidé étape par étape
- ✅ Aperçu des valeurs avant ajout
- ✅ Possibilité de skip certaines variables

---

## 🎯 MÉTHODE 3: COMMANDES MANUELLES (Avancé - 20 minutes)

### Pour chaque variable, 3 environnements:

```powershell
# Exemple: DATABASE_URL
echo "file:./dev.db" | vercel env add DATABASE_URL development
echo "postgresql://..." | vercel env add DATABASE_URL staging
echo "postgresql://..." | vercel env add DATABASE_URL production

# Exemple: NEXTAUTH_SECRET (générer nouveau pour chaque env)
$secret = openssl rand -base64 32
echo $secret | vercel env add NEXTAUTH_SECRET development

# Exemple: NEXTAUTH_URL (adapter par env)
echo "https://iapostemanage-dev.vercel.app" | vercel env add NEXTAUTH_URL development
echo "https://iapostemanage-staging.vercel.app" | vercel env add NEXTAUTH_URL staging
echo "https://iapostemanage.vercel.app" | vercel env add NEXTAUTH_URL production
```

---

## ✅ CHECKLIST FINALE

Après configuration, vérifier:

```powershell
# 1. Branches Git créées
git branch -a
# ✅ develop, staging, main doivent exister

# 2. Variables Vercel configurées
vercel env ls development
vercel env ls staging
vercel env ls production
# ✅ Minimum 5 variables critiques par env

# 3. Déploiements actifs
vercel list
# ✅ 3 déploiements (un par env)

# 4. Tester les URLs
# ✅ https://iapostemanage-dev.vercel.app (dev)
# ✅ https://iapostemanage-staging.vercel.app (staging)
# ✅ https://iapostemanage.vercel.app (production)
```

---

## 🔄 WORKFLOW GIT (Après configuration)

```
develop ──(PR)──> staging ──(PR)──> main
   ↓                 ↓               ↓
  DEV            STAGING          PRODUCTION
```

**Commandes:**

```powershell
# Développement: créer feature
git checkout develop
git checkout -b feature/nouvelle-fonctionnalite
# ... travail ...
git push origin feature/nouvelle-fonctionnalite
# Créer PR vers develop

# Staging: merger develop
git checkout staging
git merge develop
git push origin staging
# Auto-déploie sur staging

# Production: merger staging (après validation)
git checkout main
git merge staging
git push origin main
# Auto-déploie sur production
```

---

## 🛠️ COMMANDES UTILES

```powershell
# Voir toutes les variables d'un env
vercel env ls development

# Pull les variables localement
vercel env pull .env.development --environment development
vercel env pull .env.staging --environment staging
vercel env pull .env.production --environment production

# Supprimer une variable (si erreur)
vercel env rm NOM_VARIABLE development

# Voir les logs d'un déploiement
vercel logs URL_DEPLOYMENT

# Forcer un redéploiement
vercel --prod  # Pour production
vercel          # Pour preview (dev/staging)
```

---

## 🚨 IMPORTANT: SÉCURITÉ

### ❌ NE JAMAIS:
- Utiliser les mêmes `NEXTAUTH_SECRET` entre environnements
- Utiliser `sk_live_` Stripe en dev/staging
- Commit `.env.local`, `.env.development`, `.env.staging`, `.env.production`
- Partager les secrets en clair (Slack, email, etc.)

### ✅ TOUJOURS:
- Générer nouveaux secrets pour chaque env
- Utiliser `sk_test_` Stripe en dev/staging
- Vérifier `.gitignore` contient tous les `.env*`
- Chiffrer les backups de secrets
- Rotation des secrets tous les 90 jours

---

## 📞 AIDE & RÉSOLUTION

### Problème: "Vercel env add" ne fonctionne pas
**Solution:** Utiliser le Dashboard Vercel (méthode 1)

### Problème: Branches Git non créées
```powershell
git checkout -b develop
git push -u origin develop
```

### Problème: Variables non prises en compte
```powershell
# Forcer un redéploiement
vercel --prod --force
```

### Problème: URL incorrecte (404)
**Vérifier:**
1. Déploiement terminé: `vercel list`
2. Variables configurées: `vercel env ls production`
3. Build réussi: voir logs dans Vercel Dashboard

---

## 🎉 SUCCÈS!

Vous avez maintenant **3 environnements opérationnels**:

- 🟡 **Development:** Tests et features
- 🟣 **Staging:** Pre-production
- 🔴 **Production:** Live!

**Prochaine étape:** Déployer votre première feature!

```powershell
git checkout develop
# ... développer ...
git push origin develop
# → Auto-déployé sur dev! 🚀
```

---

**Besoin d'aide?** Consultez `SETUP_3_ENVIRONNEMENTS.md` pour la documentation complète.
