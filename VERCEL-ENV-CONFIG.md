# ⚙️ CONFIGURATION VERCEL - GUIDE COMPLET

## 🎯 VARIABLES D'ENVIRONNEMENT REQUISES

### 1. AUTHENTIFICATION

```bash
# JWT Secret (minimum 32 caractères)
JWT_SECRET=votre-secret-jwt-minimum-32-caracteres-ici-changez-moi

# NextAuth (si frontend Next.js)
NEXTAUTH_SECRET=votre-secret-nextauth-32-caracteres-minimum
NEXTAUTH_URL=https://votre-app.vercel.app
```

### 2. BASE DE DONNÉES

```bash
# PostgreSQL (Neon, Supabase, ou autre)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Prisma (si utilisé)
DIRECT_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### 3. EMAIL (Gmail)

```bash
# Configuration Gmail IMAP/SMTP
EmailMonitor__Username=votre-email@gmail.com
EmailMonitor__Password=votre-mot-de-passe-application-gmail
EmailMonitor__ImapHost=imap.gmail.com
EmailMonitor__ImapPort=993
EmailMonitor__SmtpHost=smtp.gmail.com
EmailMonitor__SmtpPort=587
EmailMonitor__Enabled=true
```

### 4. MONITORING (Optionnel)

```bash
# Sentry
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=votre-token-sentry

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=votre-id-analytics
```

### 5. GITHUB APP (Optionnel)

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=votre-client-id
GITHUB_CLIENT_SECRET=votre-client-secret
GITHUB_WEBHOOK_SECRET=votre-webhook-secret
```

---

## 🚀 MÉTHODE 1: VIA INTERFACE VERCEL

### Étape 1: Accéder aux Settings
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **Settings**
4. Cliquez sur **Environment Variables**

### Étape 2: Ajouter les variables
Pour chaque variable:
1. Cliquez sur **Add New**
2. **Name**: Nom de la variable (ex: `JWT_SECRET`)
3. **Value**: Valeur de la variable
4. **Environment**: Sélectionnez:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Cliquez sur **Save**

### Variables MINIMALES requises:
```
JWT_SECRET
DATABASE_URL
EmailMonitor__Username
EmailMonitor__Password
NEXTAUTH_SECRET (si Next.js)
NEXTAUTH_URL (si Next.js)
```

---

## 💻 MÉTHODE 2: VIA CLI VERCEL

### Installation CLI
```bash
npm install -g vercel
vercel login
```

### Ajouter les variables
```bash
# Production
vercel env add JWT_SECRET production
# Entrez la valeur quand demandé

vercel env add DATABASE_URL production
vercel env add EmailMonitor__Username production
vercel env add EmailMonitor__Password production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Preview (optionnel)
vercel env add JWT_SECRET preview
vercel env add DATABASE_URL preview

# Development (optionnel)
vercel env add JWT_SECRET development
vercel env add DATABASE_URL development
```

### Lister les variables
```bash
vercel env ls
```

### Supprimer une variable
```bash
vercel env rm JWT_SECRET production
```

---

## 📝 MÉTHODE 3: VIA FICHIER .env

### Créer .env.production
```bash
# .env.production (NE PAS COMMITER!)

# JWT
JWT_SECRET=changez-moi-secret-minimum-32-caracteres-ici

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Email
EmailMonitor__Username=votre-email@gmail.com
EmailMonitor__Password=votre-mot-de-passe-app

# NextAuth
NEXTAUTH_SECRET=changez-moi-secret-nextauth-32-chars
NEXTAUTH_URL=https://votre-app.vercel.app

# Sentry (optionnel)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Importer dans Vercel
```bash
# Depuis le fichier
vercel env pull .env.local

# Ou importer manuellement
vercel env add < .env.production
```

---

## 🔐 GÉNÉRATION DES SECRETS

### JWT_SECRET (32+ caractères)
```bash
# Linux/Mac
openssl rand -base64 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Ou utilisez:
# https://generate-secret.vercel.app/32
```

### NEXTAUTH_SECRET (32+ caractères)
```bash
# Même méthode que JWT_SECRET
openssl rand -base64 32
```

---

## 📊 CONFIGURATION PAR ENVIRONNEMENT

### Production
```bash
# Variables critiques
JWT_SECRET=prod-secret-32-chars
DATABASE_URL=postgresql://prod-db
NEXTAUTH_URL=https://app.memolib.fr
EmailMonitor__Enabled=true
```

### Preview (Staging)
```bash
# Variables de test
JWT_SECRET=preview-secret-32-chars
DATABASE_URL=postgresql://staging-db
NEXTAUTH_URL=https://preview.memolib.vercel.app
EmailMonitor__Enabled=false
```

### Development
```bash
# Variables locales
JWT_SECRET=dev-secret-32-chars
DATABASE_URL=postgresql://localhost:5432/memolib
NEXTAUTH_URL=http://localhost:3000
EmailMonitor__Enabled=false
```

---

## ✅ VÉRIFICATION

### Via Interface Vercel
1. Settings → Environment Variables
2. Vérifier que toutes les variables sont présentes
3. Vérifier les environnements (Production/Preview/Development)

### Via CLI
```bash
# Lister toutes les variables
vercel env ls

# Vérifier une variable spécifique
vercel env ls | grep JWT_SECRET
```

### Après déploiement
```bash
# Vérifier les logs
vercel logs

# Tester l'API
curl https://votre-app.vercel.app/api/health
```

---

## 🔧 CONFIGURATION SPÉCIFIQUE MEMOLIB

### Variables OBLIGATOIRES
```bash
# 1. JWT (Authentification)
JWT_SECRET=minimum-32-caracteres-secret-jwt

# 2. Base de données
DATABASE_URL=postgresql://user:pass@host:5432/memolib

# 3. Email Gmail
EmailMonitor__Username=votre-email@gmail.com
EmailMonitor__Password=mot-de-passe-application-gmail
```

### Variables RECOMMANDÉES
```bash
# NextAuth (si frontend Next.js)
NEXTAUTH_SECRET=minimum-32-caracteres-secret-nextauth
NEXTAUTH_URL=https://votre-app.vercel.app

# Monitoring
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Email SMTP
EmailMonitor__SmtpHost=smtp.gmail.com
EmailMonitor__SmtpPort=587
```

### Variables OPTIONNELLES
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=votre-client-id
GITHUB_CLIENT_SECRET=votre-client-secret

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=votre-id

# Environnement
NODE_ENV=production
ASPNETCORE_ENVIRONMENT=Production
```

---

## 📋 CHECKLIST COMPLÈTE

### Avant le déploiement
- [ ] Créer compte Vercel
- [ ] Installer Vercel CLI
- [ ] Préparer les secrets (JWT, Database, Email)
- [ ] Créer base de données PostgreSQL

### Configuration Vercel
- [ ] Ajouter JWT_SECRET
- [ ] Ajouter DATABASE_URL
- [ ] Ajouter EmailMonitor__Username
- [ ] Ajouter EmailMonitor__Password
- [ ] Ajouter NEXTAUTH_SECRET (si Next.js)
- [ ] Ajouter NEXTAUTH_URL (si Next.js)
- [ ] Vérifier tous les environnements

### Après le déploiement
- [ ] Vérifier les logs: `vercel logs`
- [ ] Tester l'API: `/api/health`
- [ ] Tester l'authentification
- [ ] Tester la connexion base de données
- [ ] Tester l'envoi d'emails

---

## 🚨 ERREURS COURANTES

### Erreur: "JWT_SECRET is not defined"
```bash
# Solution
vercel env add JWT_SECRET production
# Entrez un secret de 32+ caractères
```

### Erreur: "Database connection failed"
```bash
# Vérifier DATABASE_URL
vercel env ls | grep DATABASE_URL

# Tester la connexion
psql $DATABASE_URL
```

### Erreur: "NEXTAUTH_URL is not set"
```bash
# Ajouter NEXTAUTH_URL
vercel env add NEXTAUTH_URL production
# Entrez: https://votre-app.vercel.app
```

---

## 💡 BONNES PRATIQUES

### Sécurité
- ✅ Utiliser des secrets de 32+ caractères
- ✅ Ne JAMAIS commiter les fichiers .env
- ✅ Utiliser des secrets différents par environnement
- ✅ Régénérer les secrets régulièrement

### Organisation
- ✅ Documenter toutes les variables
- ✅ Utiliser des noms cohérents
- ✅ Grouper par catégorie (Auth, DB, Email)
- ✅ Versionner .env.example (sans valeurs)

### Maintenance
- ✅ Sauvegarder les variables importantes
- ✅ Tester après chaque modification
- ✅ Monitorer les logs d'erreur
- ✅ Mettre à jour la documentation

---

## 📞 COMMANDES UTILES

```bash
# Lister toutes les variables
vercel env ls

# Ajouter une variable
vercel env add NOM_VARIABLE production

# Supprimer une variable
vercel env rm NOM_VARIABLE production

# Télécharger les variables localement
vercel env pull .env.local

# Voir les logs
vercel logs

# Redéployer
vercel --prod
```

---

## 🎯 EXEMPLE COMPLET

```bash
# 1. Générer les secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# 2. Ajouter dans Vercel
vercel env add JWT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add EmailMonitor__Username production
vercel env add EmailMonitor__Password production
vercel env add NEXTAUTH_URL production

# 3. Vérifier
vercel env ls

# 4. Déployer
vercel --prod

# 5. Tester
curl https://votre-app.vercel.app/api/health
```

---

**Date**: 27 février 2026  
**Version**: 1.0.0  
**Plateforme**: Vercel  
**Statut**: 🟢 Guide complet
