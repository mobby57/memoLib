# 🔍 PostgreSQL Database Diagnostic Automation

Système automatisé de monitoring de la santé et de l'intégrité de la base de données PostgreSQL.

## 📋 Vue d'ensemble

Le système diagnostic automatisé :

- ✅ **Exécution hebdomadaire** (GitHub Actions)
- ✅ **Stockage de l'historique** (table `DatabaseDiagnosticLog`)
- ✅ **Dashboard API** pour visualiser l'état
- ✅ **Alertes Slack** en cas de problème
- ✅ **Trigger manuel** depuis l'API

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│   GitHub Actions (postgres-diagnostic)  │
│   - Lundi 8h UTC                        │
│   - Jeudi 14h UTC                       │
│   - Manual trigger                      │
└───────────────┬───────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Diagnostic Script                      │
│  (scripts/diagnostic-postgres.ts)       │
│  - Vérifie connexion                    │
│  - Valide schéma                        │
│  - Teste enums, FK, indexes             │
│  - Compte les rows                      │
└───────────────┬───────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Cron API Route                         │
│  POST /api/cron/pg-diagnostic           │
│  - Stocke résultat dans DB              │
│  - Envoie Slack si problème             │
└───────────────┬───────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Monitoring API                         │
│  GET /api/monitoring/diagnostics        │
│  - /health     → Dernier diagnostic     │
│  - /history    → Historique (paginated) │
│  - /dashboard  → Données agrégées       │
└─────────────────────────────────────────┘
```

## 📦 Composants

### 1. Modèle Prisma : `DatabaseDiagnosticLog`

```prisma
model DatabaseDiagnosticLog {
  id                    String   @id @default(cuid())
  timestamp             DateTime @default(now())
  
  // Schema checks
  schemaStatus          String   // HEALTHY, WARNING, ERROR
  accessGrantColumns    Int?
  accessGrantColumnsOk  Boolean
  
  // Enum checks
  enumAccessGrantExists Boolean
  enumValues            String?  // JSON
  
  // FK constraints
  foreignKeyCount       Int
  foreignKeysValid      Boolean
  foreignKeyDetails     String?  // JSON
  
  // Indexes
  indexCount            Int
  indexesValid          Boolean
  indexDetails          String?  // JSON
  
  // Table sizes
  accessGrantRowCount   Int
  invitationRowCount    Int
  dossierRowCount       Int
  userRowCount          Int
  
  // Connection test
  connectionOk          Boolean
  connectionError       String?
  responseTimeMs        Int?
  
  // Overall health
  overallHealth         String   // HEALTHY, DEGRADED, CRITICAL, ERROR
  healthScore           Int      // 0-100
  issues                String?  // JSON array
  warnings              String?  // JSON array
  
  // Metadata
  databaseVersion       String?
  databaseSize          Float?   // MB
  diagnosticDuration    Int?     // milliseconds
  triggeredBy           String   // scheduled, manual
  error                 String?
  
  createdAt             DateTime @default(now())
}
```

### 2. Script TypeScript : `scripts/diagnostic-postgres.ts`

Diagnostic complet :

```bash
# Exécution avec logs détaillés
npx ts-node scripts/diagnostic-postgres.ts --verbose

# Avec notification Slack
npx ts-node scripts/diagnostic-postgres.ts --verbose --slack

# Depuis GitHub Actions
npx ts-node scripts/diagnostic-postgres.ts
```

**Vérifie :**
- ✅ Connexion PostgreSQL
- ✅ Colonnes de la table `AccessGrant`
- ✅ Enum `AccessGrantStatus`
- ✅ Contraintes FK
- ✅ Indexes
- ✅ Contenu des tables

### 3. GitHub Actions : `.github/workflows/postgres-diagnostic.yml`

**Schedule :**
- Lundi 8h UTC (diagnostic standard)
- Jeudi 14h UTC (diagnostic avec Slack)
- Manuel via `workflow_dispatch`

**Fait :**
1. Checkout code
2. Setup Node.js
3. Génère Prisma client
4. Exécute diagnostic
5. Envoie Slack si échec

### 4. Cron Route : `src/app/api/cron/pg-diagnostic.ts`

```
POST /api/cron/pg-diagnostic
Authorization: Bearer {CRON_SECRET}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "healthScore": 100,
    "responseTimeMs": 42
  }
}
```

### 5. Monitoring API Routes

#### GET `/api/monitoring/diagnostics?endpoint=health`

Dernier diagnostic :
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "timestamp": "2024-11-17T08:00:00Z",
    "status": {
      "overall": "HEALTHY",
      "schema": "HEALTHY",
      "connection": "OK",
      "score": 100
    },
    "details": {
      "columns": { "expected": 9, "actual": 9, "ok": true },
      "enum": { "exists": true, "values": ["ACTIVE", "REVOKED", "EXPIRED"] },
      "foreignKeys": { "count": 3, "valid": true },
      "indexes": { "count": 4, "valid": true }
    },
    "rowCounts": {
      "accessGrant": 42,
      "invitation": 15,
      "dossier": 200,
      "user": 50
    },
    "performance": {
      "responseTimeMs": 42,
      "diagnosticDurationMs": 850
    },
    "issues": [],
    "warnings": []
  }
}
```

#### GET `/api/monitoring/diagnostics?endpoint=history&limit=10&offset=0`

Historique pagné :
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 95,
    "hasMore": true
  }
}
```

#### GET `/api/monitoring/diagnostics?endpoint=dashboard`

Dashboard agrégé (30 jours) :
```json
{
  "success": true,
  "data": {
    "latest": {...},
    "stats": {
      "averageHealthScore": 97.5,
      "minHealthScore": 80,
      "maxHealthScore": 100,
      "totalIssuesLast30Days": 2,
      "totalWarningsLast30Days": 5
    },
    "trend": {
      "direction": "improving",
      "period": "last_30_days"
    },
    "healthDistribution": {
      "HEALTHY": 24,
      "DEGRADED": 5,
      "CRITICAL": 0,
      "ERROR": 0
    },
    "diagnosticsCount": {
      "total": 29,
      "period": "last_30_days"
    }
  }
}
```

## 🚀 Setup

### 1. Ajouter les secrets GitHub

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
CRON_SECRET=your-secret-token-here
```

### 2. Exécuter les migrations Prisma

```bash
npx prisma migrate dev --name add_database_diagnostic_log
```

### 3. Générer le client Prisma

```bash
npx prisma generate
```

### 4. Tester le diagnostic manuellement

```bash
# Sans Slack
npx ts-node scripts/diagnostic-postgres.ts --verbose

# Avec Slack
export SLACK_WEBHOOK_URL=https://...
npx ts-node scripts/diagnostic-postgres.ts --verbose --slack
```

### 5. Trigger depuis l'API

```bash
curl -X POST http://localhost:3000/api/cron/pg-diagnostic \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json"
```

## 📊 Métriques de santé

| Score | État | Interprétation |
|-------|------|-----------------|
| 90-100 | ✅ HEALTHY | Base de données optimale |
| 70-89 | ⚠️ DEGRADED | Performance dégradée, à surveiller |
| 50-69 | 🔴 WARNING | Problèmes identifiés, action requise |
| 0-49 | 🚨 CRITICAL | Urgence, intervention immédiate |

## 🔔 Alertes Slack

Les alertes Slack sont envoyées si :
- État global ≠ HEALTHY
- Erreur de connexion
- Schéma invalide
- Colonnes manquantes
- Enums invalides
- FK manquantes
- Indexes manquants

**Format Slack :**

```
📊 Database Health Alert: DEGRADED
Health Score: 65/100
Connection: ✅ OK
Response Time: 450ms
Duration: 1200ms
Row Counts: AccessGrant: 42, Invitation: 15
Issues: 
• Missing AccessGrant_expiresAt_idx index
Dashboard: https://app.memolib.space/admin/monitoring/diagnostics
```

## 🛠️ Maintenance

### Nettoyer les anciens diagnostics (90+ jours)

```sql
DELETE FROM "DatabaseDiagnosticLog" 
WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

### Vérifier les logs de diagnostic

```sql
SELECT 
  timestamp,
  overallHealth,
  healthScore,
  responseTimeMs,
  issues,
  warnings
FROM "DatabaseDiagnosticLog"
WHERE timestamp > NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC
LIMIT 20;
```

### Statistiques de santé

```sql
SELECT 
  overallHealth,
  COUNT(*) as count,
  AVG(healthScore) as avg_health,
  MIN(responseTimeMs) as min_response_ms,
  MAX(responseTimeMs) as max_response_ms
FROM "DatabaseDiagnosticLog"
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY overallHealth;
```

## 📈 Évolution prévue

- [ ] Dashboard React pour visualiser les historiques
- [ ] Alertes PagerDuty pour alertes critiques
- [ ] Métriques Prometheus exportées
- [ ] Autorepair pour certains problèmes mineurs
- [ ] Comparaison avec snapshots précédents
- [ ] Préconisations d'optimisation

## 📚 Références

- [Script diagnostic complet](../scripts/diagnostic-postgres.ts)
- [GitHub Actions workflow](../.github/workflows/postgres-diagnostic.yml)
- [Cron API route](../src/app/api/cron/pg-diagnostic.ts)
- [Prisma schema](../prisma/schema.prisma)

---

**Maintenu par :** Équipe Infrastructure  
**Dernière mise à jour :** 2026-11-17  
**Version :** 1.0.0
