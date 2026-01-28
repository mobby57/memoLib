# 🏗️ MEMO LIB — SETUP INFRASTRUCTURE

**Date:** 28 janvier 2026  
**Status:** ✅ Prêt pour production  
**Version:** 1.0

---

## 📋 PRE-REQUISITES

### Système d'exploitation
- Linux / macOS / Windows (WSL2)
- Docker 20.10+ 
- Docker Compose 2.0+
- Node.js 22.22.0+
- npm 11.6.4+
- PostgreSQL 16+ (optionnel si Docker)

### Environnement
```bash
node --version    # v22.22.0
npm --version     # 11.6.4
docker --version  # Docker version 20.10+
```

---

## 🚀 SETUP LOCAL (DEVELOPMENT)

### 1️⃣ Clone et installation

```bash
git clone https://github.com/mobby57/memoLib.git
cd memoLib
npm install --legacy-peer-deps
```

### 2️⃣ Configuration environnement

```bash
# Copier template
cp .env.local.example .env.local

# Variables requises
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "DATABASE_URL=file:./dev.db" >> .env.local
echo "STRIPE_SECRET_KEY=sk_test_dummy_for_dev" >> .env.local
```

### 3️⃣ Base de données

```bash
# SQLite (par défaut - aucun setup)
npm run db:push

# OU PostgreSQL avec Docker
docker run -d \
  --name memolib_postgres \
  -e POSTGRES_USER=memolib \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=memolib \
  -p 5432:5432 \
  postgres:16-alpine

# Mettre à jour .env.local
DATABASE_URL=postgresql://memolib:devpass@localhost:5432/memolib
npm run db:push
```

### 4️⃣ Démarrer dev server

```bash
npm run dev
# http://localhost:3000
```

---

## 🐳 SETUP DOCKER (FULL STACK)

### 1️⃣ Pré-configuration

```bash
# Créer .env.docker
cat > .env.docker << 'ENVFILE'
POSTGRES_USER=memolib
POSTGRES_PASSWORD=memolib_secure_password_change
POSTGRES_DB=memolib
DATABASE_URL=postgresql://memolib:memolib_secure_password_change@postgres:5432/memolib
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=production
OLLAMA_BASE_URL=http://ollama:11434
ENVFILE
```

### 2️⃣ Lancer Docker Compose

```bash
# Configuration simple (Next.js + PostgreSQL)
docker-compose -f docker-compose.simple.yml up -d

# Configuration complète (+ PgAdmin + Ollama)
docker-compose -f docker-compose.full.yml up -d

# Configuration production
docker-compose -f docker-compose.prod.yml up -d
```

### 3️⃣ Vérifier les services

```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f app

# Santé
curl http://localhost:3000/api/health
```

### 4️⃣ Accès services

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| PgAdmin | http://localhost:5050 | admin@admin.com / admin |
| PostgreSQL | localhost:5432 | memolib / password |

---

## ⚙️ CONFIGURATION AVANCÉE

### Base de données PostgreSQL

```sql
-- Créer utilisateur application
CREATE ROLE app_user WITH PASSWORD 'app_password' LOGIN;

-- Permissions
GRANT CONNECT ON DATABASE memolib TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT ALL ON TABLES TO app_user;
```

### Variables d'environnement requises

| Variable | Dev | Prod | Obligatoire |
|----------|-----|------|-------------|
| `NEXTAUTH_SECRET` | Généré | ✅ UUID | ✅ |
| `DATABASE_URL` | file:./dev.db | PostgreSQL | ✅ |
| `NODE_ENV` | development | production | ✅ |
| `STRIPE_SECRET_KEY` | sk_test_... | sk_live_... | ❌ |
| `OPENAI_API_KEY` | - | sk-... | ❌ |
| `OLLAMA_BASE_URL` | - | http://ollama:11434 | ❌ |

### Redis (optionnel - pour queue)

```bash
# Docker
docker run -d -p 6379:6379 redis:7-alpine

# .env.local
REDIS_URL=redis://localhost:6379
```

---

## 🔍 DIAGNOSTIQUE

### Vérifier l'installation

```bash
# Dépendances
npm ls | grep -E "next|prisma|nextauth"

# Variables d'environnement
env | grep -E "DATABASE_URL|NEXTAUTH|NODE_ENV"

# Base de données
npx prisma db execute --stdin < <(echo "SELECT 1")

# Build
npm run build

# Type checking
npx tsc --noEmit
```

### Problèmes courants

#### ❌ "Cannot find module @prisma/client"
```bash
npx prisma generate
npm install
```

#### ❌ "ENOSPC: no space left on device"
```bash
# Nettoyer
rm -rf .next node_modules
npm ci --legacy-peer-deps
```

#### ❌ "Port 3000 already in use"
```bash
# Linux/Mac
lsof -i :3000 | grep node | awk '{print $2}' | xargs kill -9

# Docker
docker-compose down
```

#### ❌ "Cannot connect to database"
```bash
# Vérifier DATABASE_URL
echo $DATABASE_URL

# Test connexion
npx prisma db execute --stdin < <(echo "SELECT NOW()")

# PostgreSQL (si Docker)
docker-compose logs postgres
```

---

## 📦 DEPLOYMENT

### Vercel (Frontend)

```bash
# Connecter repository
vercel link

# Ajouter variables d'environnement
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add STRIPE_SECRET_KEY

# Deploy
vercel --prod
```

### Azure Container Instances (Backend API)

```bash
# Build image
docker build -t memolib:latest .

# Tag pour Azure
docker tag memolib:latest memelibregistry.azurecr.io/memolib:latest

# Push
az acr build --registry memelibregistry \
  --image memolib:latest .

# Deploy
az container create \
  --resource-group memolib-rg \
  --name memolib-app \
  --image memelibregistry.azurecr.io/memolib:latest \
  --registry-login-server memelibregistry.azurecr.io \
  --environment-variables DATABASE_URL=$DB_URL NEXTAUTH_SECRET=$SECRET
```

---

## ✅ CHECKLIST PRE-LAUNCH

- [ ] `npm run build` = 0 erreurs
- [ ] `npx tsc --noEmit` = 0 erreurs
- [ ] `npm audit` = accepté
- [ ] Base de données testée
- [ ] Variables d'environnement production définies
- [ ] HTTPS/TLS activé
- [ ] Monitoring configuré (Sentry/Datadog)
- [ ] Backups automatisés activés
- [ ] Secrets sécurisés (Azure Key Vault)
- [ ] Tests E2E passent
- [ ] Documentation mise à jour
- [ ] Security audit passed

---

## 📚 RESSOURCES

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deploy](https://www.prisma.io/docs/guides/deployment)
- [Docker Compose Ref](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Dernière mise à jour:** 28 janvier 2026  
**Status:** ✅ Production Ready
