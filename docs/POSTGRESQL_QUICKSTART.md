# 🐘 POSTGRESQL QUICKSTART - IA POSTE MANAGER

## 🚀 Démarrage Rapide (3 Minutes)

### Option 1: Local Docker (Recommandé)

```powershell
# 1. Démarrer PostgreSQL + pgAdmin
docker-compose up -d postgres pgadmin

# 2. Attendre 30 secondes (initialisation)
Start-Sleep -Seconds 30

# 3. Appliquer le schema Prisma
npx prisma db push

# 4. Migrer les données SQLite
.\scripts\migrate-sqlite-to-postgres.ps1

# 5. Vérifier
.\scripts\migrate-sqlite-to-postgres.ps1 -Verify
```

**Accès:**
- PostgreSQL: `localhost:5432`
- pgAdmin: http://localhost:5050 (admin@iapostemanager.com / admin123)

---

### Option 2: Vercel Postgres

```bash
# 1. Ajouter Postgres
vercel integration add postgres

# 2. Récupérer la connection string
vercel env pull .env.local

# 3. Migrer
npx prisma db push
node scripts/migrate-db.js
```

---

### Option 3: Neon.tech (Gratuit)

```powershell
# 1. Créer un projet sur https://neon.tech
# 2. Copier la connection string
# 3. Ajouter dans .env.local:
#    DATABASE_URL="postgresql://user:pass@...neon.tech/..."

# 4. Migrer
npx prisma db push
.\scripts\migrate-sqlite-to-postgres.ps1
```

---

## 📊 Configuration dans le Code

```typescript
// Avant (SQLite)
import { prisma } from '@/lib/prisma';

// Après (PostgreSQL)
import { postgres } from '@/lib/postgres.config';

// Utilisation identique
const users = await postgres.user.findMany();
```

---

## ✅ Health Check

```typescript
import { healthCheck } from '@/lib/postgres.config';

const health = await healthCheck();
console.log(health.healthy ? '✅ OK' : '❌ KO');
```

---

## 🔄 Variables d'Environnement

```env
# .env.local

# Local Docker
DATABASE_URL="postgresql://iapostemanage:changeme@localhost:5432/iapostemanage"

# Vercel Postgres (auto-généré)
DATABASE_URL="postgres://vercel-admin:xxx@xxx-pooler.aws.vercel.com/verceldb"

# Neon.tech
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Supabase
DATABASE_URL="postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres"
```

---

## 📚 Documentation Complète

Voir [POSTGRESQL_CONFIG_GUIDE.md](./POSTGRESQL_CONFIG_GUIDE.md) pour:
- Optimisations performance
- Monitoring avancé
- Backup/Restauration
- Troubleshooting

---

## 🆘 Problèmes Courants

**Connection refused:**
```bash
docker-compose restart postgres
```

**Migrations échouées:**
```bash
npx prisma migrate reset
npx prisma db push
```

**Performances lentes:**
```sql
-- Dans pgAdmin
ANALYZE;
VACUUM;
```

---

**✅ C'est tout! PostgreSQL est prêt.**
