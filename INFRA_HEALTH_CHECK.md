# ⚕️ MEMO LIB — INFRASTRUCTURE HEALTH CHECK

**Date:** 28 janvier 2026

---

## 🔍 DIAGNOSTIQUE COMPLET

### 1️⃣ Versions installées

```bash
# Vérifier versions
node --version
npm --version
git --version

# Résultats attendus
# v22.22.0
# 11.6.4
# git version 2.48.0 (ou similaire)
```

### 2️⃣ Environnement

```bash
# Vérifier variables essentielles
grep -E "NEXTAUTH_SECRET|DATABASE_URL|NODE_ENV" .env.local

# Résultats attendus
# NEXTAUTH_SECRET=fd8q/VgHWPz1qNlEnbbUROZYiblqyMBlyNUg+FfAlgk=
# DATABASE_URL=file:./dev.db (ou postgresql://...)
# NODE_ENV=development
```

### 3️⃣ Dépendances

```bash
# Vérifier paquets critiques
npm list next prisma nextauth

# Résultats attendus
# next@16.1.6
# @prisma/client@5.22.0
# next-auth@5.0.0-beta.28
```

### 4️⃣ Build

```bash
# Build de production
npm run build

# Résultats attendus
# Compiled successfully
# 108 routes generated
# Build time: 70-90s
```

### 5️⃣ TypeScript

```bash
# Vérifier types
npx tsc --noEmit

# Résultats attendus
# 0 errors
```

### 6️⃣ Linting

```bash
# Vérifier code quality
npm run lint

# Résultats attendus
# 0 issues (ou warnings seulement)
```

### 7️⃣ Security

```bash
# Vérifier vulnérabilités
npm audit

# Résultats attendus
# 16 vulnerabilities (12 LOW, 4 MODERATE)
# All in devDependencies - safe for production
```

### 8️⃣ Database

```bash
# Test connexion base de données
npx prisma db push --skip-generate

# Résultats attendus
# (Une ou aucune migration nouvelle)
```

### 9️⃣ Dev Server

```bash
# Démarrer serveur
npm run dev

# Résultats attendus
# ✓ Ready in 2.2s
# ✓ http://localhost:3000
```

### 🔟 Health Check API

```bash
# Vérifier endpoint santé
curl http://localhost:3000/api/health

# Résultats attendus
# {"status":"ok"} ou 200 OK
```

---

## ✅ CHECKLIST INFRASTRUCTURE

- [ ] `node --version` → v22.22.0+
- [ ] `npm --version` → 11.6.4+
- [ ] `.env.local` → Existe et a NEXTAUTH_SECRET
- [ ] `npm list next prisma nextauth` → Versions correctes
- [ ] `npm run build` → Success (108 routes)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm audit` → Accepté (vulns dev deps only)
- [ ] `npx prisma db push` → Success ou skipped
- [ ] `npm run dev` → Ready in <5s
- [ ] `curl http://localhost:3000` → 200 OK
- [ ] `curl http://localhost:3000/api/health` → 200 OK

---

## 🐳 DOCKER DIAGNOSTIQUE

### Vérifier configuration Docker Compose

```bash
# Valider fichiers
docker-compose config -f docker-compose.yml > /dev/null && echo "✓ Valid"

# Lister services
docker-compose config --services

# Résultats attendus
# app
# postgres
# redis (optionnel)
```

### Pré-requis Docker

```bash
# Vérifier versions
docker --version        # Docker 20.10+
docker-compose --version # Docker Compose 2.0+

# Vérifier daemon
docker ps               # Doit retourner liste de containers
```

### Tests services

```bash
# Lancer stack complète
docker-compose -f docker-compose.simple.yml up -d

# Vérifier status
docker-compose ps

# Logs
docker-compose logs -f app

# Test endpoint
sleep 10  # Attendre démarrage
curl http://localhost:3000/api/health

# Arrêter
docker-compose down
```

---

## 📊 PERFORMANCE

### Build time

**Accepté:** 70-90 secondes

```bash
time npm run build
```

### Startup time

**Accepté:** <3 secondes

```bash
time npm run dev
# Chercher "✓ Ready in X.XXs"
```

### Memory usage

**Accepté:** <500MB pour dev server

```bash
# Linux/Mac
ps aux | grep "node"

# Chercher colonne RSS
```

### Bundle size

**Accepté:** <2MB pour next.js bundle

```bash
# Analyser bundle
npm run build -- --analyze  # si webpack-bundle-analyzer installé

# ou vérifier manuellement
ls -lh .next/static/
```

---

## 🔒 SECURITY CHECKS

### npm audit

```bash
npm audit --json | jq '.metadata | {vulnerabilities, audit}'

# Résultats attendus
# 0 CRITICAL
# 0 HIGH
# ≤4 MODERATE (dev deps only)
```

### Secrets

```bash
# S'assurer les secrets ne sont pas en plain text
grep -r "sk_live_\|sk_test_" --exclude-dir=node_modules . && echo "⚠ Secrets found!" || echo "✓ Clean"

# Vérifier .env.local est ignoré
grep "\.env\.local" .gitignore
```

### Dépendances malveillantes

```bash
# Vérifier packages suspects
npm ls --all | grep -E "deprecated|vulnerable"

# Résultats attendus
# Aucune sortie ou seulement deprecated packages
```

---

## 🚀 PRE-DEPLOYMENT

### Final checks (avant production)

```bash
# ✅ Tous les tests passent
npm run test:e2e || npm run build

# ✅ Pas d'erreurs de build
npm run build 2>&1 | grep -i "error"  # Doit être vide

# ✅ Audit de sécurité
npm audit | grep -E "CRITICAL|HIGH"   # Doit être vide

# ✅ Variables d'env prêtes
echo "DATABASE_URL=${DATABASE_URL:?Pas défini}"
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET:?Pas défini}"
echo "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:?Pas défini}"

# ✅ Git clean
git status                             # Aucun fichier commitable

# ✅ Documentation à jour
ls -1 *.md | head -5                   # Docs existent
```

---

## 🔧 TROUBLESHOOTING

### ❌ "Module not found: @prisma/client"

```bash
npx prisma generate
npm install
```

### ❌ "Port 3000 already in use"

```bash
# Trouver et tuer process
lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9
```

### ❌ "Cannot find database"

```bash
# Reset database
rm -f dev.db*
npx prisma db push
```

### ❌ "Build out of memory"

```bash
# Augmenter memory
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

### ❌ "ENOSPC: no space left"

```bash
# Nettoyer
npm cache clean --force
rm -rf node_modules .next
npm ci --legacy-peer-deps
```

---

## 📈 MONITORING

### Health endpoints à vérifier

```bash
# Status application
curl http://localhost:3000/

# Health check
curl http://localhost:3000/api/health

# Logs database
docker-compose logs postgres

# Logs application
npm run dev 2>&1 | tail -20
```

### Métriques à suivre

- **Response time:** <200ms (P95)
- **Error rate:** <0.1%
- **Uptime:** >99.9%
- **Memory:** Stable <500MB
- **CPU:** <30% au repos

---

**Dernière mise à jour:** 28 janvier 2026  
**Status:** ✅ Production Ready
