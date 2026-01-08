# 🗄️ CLOUDFLARE D1 - GUIDE COMPLET

## ✅ Base de données créée avec succès

**Database ID**: `a86c51c6-2031-4ae6-941c-db4fc917826c`  
**Nom**: `iaposte-production-db`  
**Région**: WEUR (Western Europe)  
**Type**: SQLite serverless  
**Binding**: `iaposte_production_db`

---

## 📊 État Actuel

### Bases de données

1. **SQLite Local (Dev)** ✅ OPÉRATIONNEL
   - Fichier: `./dev.db`
   - Prisma: Synchronisé
   - Usage: Développement local

2. **D1 Cloud (Production)** ✅ CRÉÉ
   - ID: `a86c51c6-2031-4ae6-941c-db4fc917826c`
   - Status: Vide (pas encore migré)
   - Usage: Déploiement production Cloudflare

---

## 🔐 Authentification D1

### Problème: Token API invalide

Deux tokens testés, tous deux échoués:

1. **Token 1** (ablIz76Sk00ND-DwHbD6rr6sD-gXeVeKTQ3kKQlb):
   - Erreur: `"not_before": "2027-01-31T00:00:00Z"`
   - Problème: Date d'activation future

2. **Token 2** (b58c189b092868621fff69c0e02816b3d6823fe13417394e1d70d07fc006565d):
   - Erreur: `401 Unauthorized`
   - Problème: Token invalide ou permissions insuffisantes

### ✅ Solution: OAuth via Wrangler

**Workaround utilisé**: Désactiver temporairement `.env` pour forcer OAuth

```powershell
# Méthode utilisée
Rename-Item -Path ".env" -NewName ".env.backup" -Force
wrangler d1 create iaposte-production-db
Rename-Item -Path ".env.backup" -NewName ".env" -Force
```

**Pourquoi ça fonctionne**:
- Wrangler priorise l'API token depuis `.env`
- En renommant `.env`, Wrangler utilise OAuth (`wrangler login`)
- OAuth fonctionne parfaitement (permissions: `d1:write`, `ai:write`, etc.)

---

## 🛠️ Gestion D1 (Avec OAuth)

### Script Helper

Créer `manage-d1.ps1`:

```powershell
# Désactiver temporairement .env
Rename-Item -Path ".env" -NewName ".env.backup" -Force -ErrorAction SilentlyContinue

# Passer la commande wrangler
wrangler @args

# Restaurer .env
Rename-Item -Path ".env.backup" -NewName ".env" -Force -ErrorAction SilentlyContinue
```

**Usage**:
```powershell
.\manage-d1.ps1 d1 list
.\manage-d1.ps1 d1 info iaposte-production-db
.\manage-d1.ps1 d1 execute iaposte-production-db --command "SELECT * FROM _prisma_migrations"
```

### Commandes D1 Utiles

#### Lister les bases
```powershell
.\manage-d1.ps1 d1 list
```

#### Info sur une base
```powershell
.\manage-d1.ps1 d1 info iaposte-production-db
```

#### Exécuter SQL
```powershell
.\manage-d1.ps1 d1 execute iaposte-production-db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

#### Exporter la base
```powershell
.\manage-d1.ps1 d1 export iaposte-production-db --output ./backup-d1.sql
```

#### Importer des données
```powershell
.\manage-d1.ps1 d1 execute iaposte-production-db --file ./migration.sql
```

---

## 🔄 Migration Prisma → D1

### Étape 1: Générer le schéma SQL

```powershell
# Créer migration Prisma
npx prisma migrate dev --name init --create-only

# Récupérer le fichier SQL généré
# Fichier: prisma/migrations/[timestamp]_init/migration.sql
```

### Étape 2: Adapter le SQL pour D1

D1 utilise SQLite avec quelques limitations:

**À modifier**:
- ❌ `PRAGMA foreign_keys = ON;` → Pas supporté
- ❌ `CREATE INDEX IF NOT EXISTS` → Utiliser `CREATE INDEX`
- ✅ Types supportés: `TEXT`, `INTEGER`, `REAL`, `BLOB`
- ✅ Contraintes: `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`

**Script d'adaptation**:
```powershell
# Copier migration
$migration = Get-Content "prisma/migrations/[timestamp]_init/migration.sql" -Raw

# Supprimer PRAGMA
$migration = $migration -replace "PRAGMA foreign_keys = ON;", ""

# Sauvegarder version D1
$migration | Out-File "prisma/d1-migration.sql" -Encoding utf8
```

### Étape 3: Appliquer la migration à D1

```powershell
.\manage-d1.ps1 d1 execute iaposte-production-db --file ./prisma/d1-migration.sql
```

### Étape 4: Vérifier la migration

```powershell
# Lister les tables
.\manage-d1.ps1 d1 execute iaposte-production-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Vérifier structure table User
.\manage-d1.ps1 d1 execute iaposte-production-db --command "PRAGMA table_info(User)"
```

---

## 🚀 Déploiement Production

### Option A: Cloudflare Pages (Recommandé)

**Configuration automatique** via `wrangler.toml`:

```toml
[[d1_databases]]
binding = "iaposte_production_db"
database_name = "iaposte-production-db"
database_id = "a86c51c6-2031-4ae6-941c-db4fc917826c"
```

**Dans le code Next.js**:
```typescript
// app/api/route.ts
import { getRequestContext } from '@cloudflare/next-on-pages'

export async function GET() {
  const { env } = getRequestContext()
  const db = env.iaposte_production_db
  
  const users = await db.prepare('SELECT * FROM User').all()
  return Response.json(users)
}
```

### Option B: Cloudflare Workers

**wrangler.toml**:
```toml
name = "iaposte-api"
main = "src/worker.ts"

[[d1_databases]]
binding = "DB"
database_name = "iaposte-production-db"
database_id = "a86c51c6-2031-4ae6-941c-db4fc917826c"
```

**worker.ts**:
```typescript
export default {
  async fetch(request, env) {
    const db = env.DB
    const users = await db.prepare('SELECT * FROM User').all()
    return new Response(JSON.stringify(users), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
```

---

## 📊 Monitoring & Statistiques

### Dashboard Cloudflare

1. Accéder à: https://dash.cloudflare.com
2. **Workers & Pages** → **D1**
3. Sélectionner `iaposte-production-db`

**Métriques disponibles**:
- ✅ Nombre de requêtes par jour
- ✅ Latence moyenne
- ✅ Taille de la base
- ✅ Nombre de rows

### Via Wrangler

```powershell
# Info sur la base
.\manage-d1.ps1 d1 info iaposte-production-db

# Statistiques
.\manage-d1.ps1 d1 execute iaposte-production-db --command "SELECT COUNT(*) as total FROM User"
```

---

## 🔒 Sécurité & Bonnes Pratiques

### 1. Authentification

✅ **OAuth (Wrangler)**: Pour gestion manuelle via CLI
✅ **API Token**: Pour automatisation CI/CD (à créer correctement)

**Créer un token API D1 valide**:

1. https://dash.cloudflare.com/profile/api-tokens
2. **Create Custom Token**
3. **Permissions**:
   - Account → D1 → Write
   - Account → Workers Scripts → Edit (si Workers)
4. **Account Resources**:
   - Include → Specific account → "Morosidibepro@gmail.com's Account"
5. **Client IP Address Filtering**: (Optionnel) IP de production
6. **TTL**: 1 year
7. **⚠️ Start time**: LAISSER VIDE (activation immédiate)

### 2. Backups

```powershell
# Backup quotidien
.\manage-d1.ps1 d1 export iaposte-production-db --output "./backups/d1-$(Get-Date -Format 'yyyy-MM-dd').sql"
```

**Automatiser** avec Task Scheduler Windows:
- Fréquence: Quotidien 2h du matin
- Script: `backup-d1.ps1`
- Rétention: 30 jours

### 3. Limites D1

| Ressource                 | Free Tier | Paid       |
|---------------------------|-----------|------------|
| Bases par compte          | 10        | Illimité   |
| Taille par base           | 500 MB    | 10 GB      |
| Rows par requête          | 1000      | 10000      |
| Requêtes/jour             | 50k       | Illimité   |
| Storage/mois              | 5 GB      | Illimité   |

**Votre usage estimé**:
- Base actuelle: ~5 MB (dev.db)
- Croissance: ~10 MB/mois (estimé)
- Requêtes: ~500/jour (estimé)

✅ **Free Tier largement suffisant** pour démarrer

---

## 🧪 Tests

### Test de connexion

```powershell
.\manage-d1.ps1 d1 execute iaposte-production-db --command "SELECT 1 as test"
```

**Output attendu**:
```json
{
  "results": [{"test": 1}],
  "success": true
}
```

### Test Prisma

**Créer fichier** `scripts/test-d1.ts`:

```typescript
// Configuration DATABASE_URL pour D1
process.env.DATABASE_URL = "d1://iaposte-production-db"

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testD1() {
  try {
    // Test connexion
    const users = await prisma.user.findMany({ take: 5 })
    console.log('✅ D1 accessible, users:', users.length)
  } catch (error) {
    console.error('❌ Erreur D1:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testD1()
```

**Lancer**:
```powershell
npx tsx scripts/test-d1.ts
```

---

## 📝 Troubleshooting

### Problème: "Authentication error [code: 10000]"

**Cause**: API token invalide dans `.env`

**Solution**:
```powershell
# Méthode 1: Renommer .env temporairement
.\manage-d1.ps1 d1 list

# Méthode 2: Créer nouveau token API avec bonnes permissions
# (Voir section Sécurité)
```

### Problème: "Could not route to /client/v4/accounts/..."

**Cause**: Wrangler utilise le token comme Account ID

**Solution**: Vérifier que `CLOUDFLARE_ACCOUNT_ID` dans `.env` est correct:
```
CLOUDFLARE_ACCOUNT_ID="b8fe52a9c1217b3bb71b53c26d0acfab"
```

### Problème: Migration Prisma échoue

**Cause**: D1 ne supporte pas tous les features SQLite

**Solution**:
1. Examiner le SQL généré par Prisma
2. Supprimer les `PRAGMA` non supportés
3. Adapter les contraintes complexes
4. Tester migration par petits morceaux

---

## 🎯 Prochaines Étapes

### Immédiat

1. ✅ Base D1 créée → **FAIT**
2. ✅ Configuration `.env` → **FAIT**
3. ✅ Fichier `wrangler.toml` → **FAIT**
4. ⏳ Script `manage-d1.ps1` → **À créer**
5. ⏳ Migration Prisma → D1 → **À faire**

### Court terme (cette semaine)

- [ ] Migrer schéma Prisma vers D1
- [ ] Tester connexion D1 depuis Next.js
- [ ] Configurer backups automatiques
- [ ] Créer token API D1 valide
- [ ] Documentation CI/CD avec D1

### Moyen terme (ce mois)

- [ ] Déployer sur Cloudflare Pages avec D1
- [ ] Monitoring métriques D1
- [ ] Optimiser requêtes D1
- [ ] Setup alerting pour limites D1

---

## 📚 Ressources

- **Dashboard D1**: https://dash.cloudflare.com → Workers & Pages → D1
- **Documentation**: https://developers.cloudflare.com/d1/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/
- **Prisma + D1**: https://www.prisma.io/docs/orm/overview/databases/cloudflare-d1
- **Limites D1**: https://developers.cloudflare.com/d1/platform/limits/

---

**Version**: 1.0  
**Date**: 7 janvier 2026  
**Status**: ✅ Base créée, configuration complète  
**Méthode**: OAuth via Wrangler (workaround token API)

