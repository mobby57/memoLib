# ============================================
# 🐘 CONFIGURATION POSTGRESQL AVANCÉE
# Guide Complet - IA Poste Manager
# ============================================

## 📚 Table des Matières

1. [Installation et Configuration](#installation)
2. [Migration SQLite → PostgreSQL](#migration)
3. [Optimisations Performance](#optimisations)
4. [Monitoring et Métriques](#monitoring)
5. [Backup et Restauration](#backup)
6. [Production Deployment](#production)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation et Configuration {#installation}

### Option 1: Local Docker (Recommandé pour développement)

```bash
# Démarrer PostgreSQL + pgAdmin
docker-compose up -d postgres pgadmin

# Vérifier que tout fonctionne
docker-compose ps
```

**Accès:**
- PostgreSQL: `localhost:5432`
- pgAdmin Web: `http://localhost:5050`
  - Email: `admin@iapostemanager.com`
  - Password: `admin123` (ou variable `PGADMIN_PASSWORD`)

### Option 2: Vercel Postgres (Production)

```bash
# Installer Vercel CLI
npm i -g vercel

# Ajouter Postgres à votre projet
vercel integration add postgres

# Récupérer la connection string
vercel env pull .env.local
```

### Option 3: Neon.tech (Gratuit)

1. Créer un compte sur https://neon.tech
2. Créer un nouveau projet
3. Copier la connection string
4. Ajouter à `.env.local`:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Option 4: Supabase (Gratuit)

1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet
3. Onglet Settings → Database → Connection string
4. Ajouter à `.env.local`

---

## 🔄 Migration SQLite → PostgreSQL {#migration}

### Étape 1: Backup SQLite

```powershell
# Créer un backup de sécurité
Copy-Item "prisma/dev.db" "backups/dev_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

### Étape 2: Configurer PostgreSQL

```env
# .env.local
DATABASE_URL="postgresql://iapostemanage:changeme@localhost:5432/iapostemanage"
# Ou pour Vercel/Neon/Supabase
DATABASE_URL="votre-connection-string-ici"
```

### Étape 3: Appliquer le Schema Prisma

```bash
# Générer les migrations
npx prisma migrate dev --name init_postgres

# Ou pusher directement le schema
npx prisma db push
```

### Étape 4: Migrer les Données

```powershell
# Test à blanc (dry run)
.\scripts\migrate-sqlite-to-postgres.ps1 -DryRun

# Migration réelle
.\scripts\migrate-sqlite-to-postgres.ps1

# Vérifier la migration
.\scripts\migrate-sqlite-to-postgres.ps1 -Verify
```

**Résultat attendu:**
```
╔═══════════════════════════════════════════════════════════╗
║  📊 RÉSULTATS DE LA MIGRATION                             ║
╚═══════════════════════════════════════════════════════════╝

   Plan                              5 enregistrements
   Tenant                            3 enregistrements
   User                             12 enregistrements
   Client                           45 enregistrements
   Dossier                          78 enregistrements
   ...

   Total:                          543 enregistrements
   Durée:                        12.34s
   Erreurs:                           0

✅ Migration terminée avec succès!
```

### Étape 5: Mettre à Jour le Code

```typescript
// Avant (SQLite)
import { prisma } from '@/lib/prisma';

// Après (PostgreSQL)
import { postgres } from '@/lib/postgres.config';

// Utilisation identique
const users = await postgres.user.findMany();
```

---

## ⚡ Optimisations Performance {#optimisations}

### 1. Connection Pooling

Le fichier `postgres.config.ts` configure automatiquement le pooling:

```typescript
// Développement: 5 connexions max
// Production: 20 connexions max
// Test: 2 connexions max
```

**Vercel/Serverless:**
```typescript
// Le pooling est ajusté automatiquement
maxConnections: 10 // Limite Vercel
```

### 2. Index Recommandés

Créer des index sur les colonnes fréquemment recherchées:

```sql
-- Index sur tenantId (isolation multi-tenant)
CREATE INDEX idx_dossier_tenant ON "Dossier" ("tenantId");
CREATE INDEX idx_client_tenant ON "Client" ("tenantId");
CREATE INDEX idx_facture_tenant ON "Facture" ("tenantId");

-- Index sur statuts/priorités
CREATE INDEX idx_dossier_statut ON "Dossier" (statut);
CREATE INDEX idx_dossier_priorite ON "Dossier" (priorite);

-- Index composites
CREATE INDEX idx_dossier_tenant_statut ON "Dossier" ("tenantId", statut);

-- Index dates (pour recherches par période)
CREATE INDEX idx_dossier_echeance ON "Dossier" ("dateEcheance");
CREATE INDEX idx_facture_echeance ON "Facture" ("dateEcheance");

-- Index full-text search (emails, clients)
CREATE INDEX idx_email_subject_trgm ON "Email" USING gin (subject gin_trgm_ops);
CREATE INDEX idx_client_name_trgm ON "Client" USING gin (("firstName" || ' ' || "lastName") gin_trgm_ops);
```

### 3. Vues Matérialisées

Des vues pré-calculées pour les queries lourdes:

```sql
-- Rafraîchir manuellement
REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY dossiers_at_risk;

-- Ou via code
await postgres.$executeRawUnsafe('REFRESH MATERIALIZED VIEW tenant_stats');
```

### 4. Query Optimization

```typescript
// ❌ Mauvais (N+1 queries)
const dossiers = await postgres.dossier.findMany();
for (const d of dossiers) {
  const client = await postgres.client.findUnique({ where: { id: d.clientId } });
}

// ✅ Bon (1 query avec include)
const dossiers = await postgres.dossier.findMany({
  include: {
    client: true,
    factures: true,
    documents: true,
  },
});
```

---

## 📊 Monitoring et Métriques {#monitoring}

### Health Check

```typescript
import { healthCheck } from '@/lib/postgres.config';

const health = await healthCheck();
console.log(health);
/*
{
  healthy: true,
  latency: 12.5,
  version: "PostgreSQL 16.1",
  connections: {
    active: 3,
    idle: 2,
    total: 5
  },
  timestamp: 2026-01-08T...
}
*/
```

### Métriques de Requêtes

```typescript
import { getMetrics, getSlowQueries } from '@/lib/postgres.config';

// Métriques globales
const metrics = await getMetrics();
console.log(metrics);
/*
{
  totalQueries: 1234,
  slowQueries: 5,
  avgDuration: 45.2,
  maxDuration: 1250,
  p95Duration: 180,
  p99Duration: 450
}
*/

// Top 10 requêtes lentes (> 1000ms)
const slow = await getSlowQueries(1000);
slow.forEach(q => {
  console.log(`${q.duration}ms - ${q.query.substring(0, 100)}`);
});
```

### Dashboard pgAdmin

**Accès:** http://localhost:5050

**Queries utiles:**

```sql
-- Connexions actives
SELECT * FROM pg_stat_activity 
WHERE datname = 'iapostemanage';

-- Requêtes lentes en cours
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' AND now() - query_start > interval '1 second';

-- Taille des tables
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index non utilisés
SELECT schemaname, tablename, indexname 
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 AND schemaname = 'public';
```

---

## 💾 Backup et Restauration {#backup}

### Backup Automatique

```bash
# Script de backup quotidien
docker exec iaposte_postgres pg_dump -U iapostemanage iapostemanage > backups/db_$(date +%Y%m%d).sql
```

### Backup Vercel Postgres

```bash
# Backup via Vercel CLI
vercel integration backup postgres

# Ou via pg_dump distant
pg_dump "$(vercel env get DATABASE_URL)" > backup.sql
```

### Restauration

```bash
# Local Docker
docker exec -i iaposte_postgres psql -U iapostemanage iapostemanage < backups/db_20260108.sql

# Vercel/Remote
psql "$DATABASE_URL" < backup.sql
```

---

## 🚀 Production Deployment {#production}

### Vercel Deployment

1. **Ajouter Postgres Integration:**
```bash
vercel integration add postgres
```

2. **Configurer les Variables:**
```bash
vercel env add DATABASE_URL production
# Coller la connection string Vercel Postgres
```

3. **Appliquer les Migrations:**
```bash
# Dans vercel.json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build"
}
```

4. **Déployer:**
```bash
vercel --prod
```

### Configuration SSL

Pour production (Vercel/Neon/Supabase):

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

Le code détecte automatiquement et active SSL:

```typescript
// postgres.config.ts détecte le provider
ssl: provider === 'local' ? false : { rejectUnauthorized: true }
```

### Optimisations Production

```typescript
// Connection pooling ajusté
maxConnections: 20          // Production
connectionTimeout: 5000     // 5s timeout
statementTimeout: 60000     // 1min max par query
logging: false              // Désactivé en prod
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Erreur: "Connection refused"

```bash
# Vérifier que PostgreSQL tourne
docker-compose ps postgres

# Voir les logs
docker-compose logs postgres

# Redémarrer
docker-compose restart postgres
```

### Erreur: "Too many connections"

```sql
-- Voir les connexions actives
SELECT count(*) FROM pg_stat_activity;

-- Augmenter la limite (dans docker-compose.yml)
POSTGRES_MAX_CONNECTIONS=200

-- Ou killer les connexions idle
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';
```

### Erreur: "SSL required"

```env
# Ajouter ?sslmode=require
DATABASE_URL="postgresql://...?sslmode=require"
```

### Performances dégradées

```sql
-- Analyser les stats
ANALYZE;

-- Vacuum complet
VACUUM FULL;

-- Reindexer
REINDEX DATABASE iapostemanage;
```

### Migration échouée

```powershell
# Restaurer le backup SQLite
Copy-Item "backups/dev_backup_20260108.db" "prisma/dev.db" -Force

# Réinitialiser PostgreSQL
docker-compose down -v postgres
docker-compose up -d postgres

# Retenter la migration
.\scripts\migrate-sqlite-to-postgres.ps1
```

---

## 📈 Métriques de Performance Attendues

| Environnement | Connexions | Latency Avg | Queries/sec |
|---------------|-----------|-------------|-------------|
| Local         | 5         | < 10ms      | 100+        |
| Vercel        | 10        | < 50ms      | 500+        |
| Neon          | 15        | < 30ms      | 1000+       |
| Supabase      | 15        | < 40ms      | 800+        |

---

## 🎯 Checklist Production

- [ ] Migration SQLite → PostgreSQL réussie
- [ ] Vérification des données (`-Verify`)
- [ ] Index créés sur colonnes clés
- [ ] SSL activé en production
- [ ] Backups automatiques configurés
- [ ] Monitoring actif (pgAdmin/Grafana)
- [ ] Variables d'environnement sécurisées
- [ ] Connection pooling optimisé
- [ ] Logs désactivés en production
- [ ] Health checks API configurés

---

## 📚 Ressources Supplémentaires

- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon.tech Docs](https://neon.tech/docs)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

---

## 🆘 Support

En cas de problème:

1. Vérifier les logs: `docker-compose logs postgres`
2. Health check: `curl http://localhost:3000/api/health/db`
3. Consulter la documentation ci-dessus
4. Ouvrir une issue GitHub

---

**Créé avec ❤️ pour IA Poste Manager**  
**Date:** 8 janvier 2026
