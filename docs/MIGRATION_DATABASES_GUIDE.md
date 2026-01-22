# 🔄 Guide de Migration PostgreSQL → SQLite/D1

## 📋 Options de Migration

### Option 1: Script Custom TypeScript (Recommandé) ✅

Notre script [migrate-postgres-to-sqlite.ts](../scripts/migrate-postgres-to-sqlite.ts) offre:

- ✅ Migration par batch (contrôle mémoire)
- ✅ Gestion des dépendances entre modèles
- ✅ Validation automatique post-migration
- ✅ Rapport détaillé JSON
- ✅ Mode dry-run pour tests
- ✅ Gestion d'erreurs robuste

**Usage:**

```bash
# Mode test (dry-run)
npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run

# Migration réelle
POSTGRES_URL="postgresql://user:pass@host:5432/db" \
SQLITE_PATH="./prisma/migrated.db" \
BATCH_SIZE=100 \
npx tsx scripts/migrate-postgres-to-sqlite.ts

# Avec validation
npx tsx scripts/migrate-postgres-to-sqlite.ts && \
npx tsx scripts/test-all-databases.ts
```

**Variables d'environnement:**

```env
POSTGRES_URL=postgresql://iapostemanage:changeme@localhost:5432/iapostemanage
SQLITE_PATH=./prisma/migrated.db
BATCH_SIZE=100  # Nombre d'enregistrements par batch
```

---

### Option 2: pgloader (Outil Linux) 🐧

**Installation:**

```bash
# Ubuntu/Debian
sudo apt-get install pgloader

# MacOS
brew install pgloader

# Docker (Windows compatible)
docker pull dimitri/pgloader
```

**Configuration pgloader:**

Créer `migration.load`:

```lisp
LOAD DATABASE
    FROM postgresql://iapostemanage:changeme@localhost:5432/iapostemanage
    INTO sqlite://./prisma/migrated.db

WITH include drop, create tables, create indexes, reset sequences,
     workers = 4, concurrency = 1,
     batch rows = 100

SET work_mem to '128MB',
    maintenance_work_mem to '512MB'

CAST type datetime to text drop typemod,
     type json to text,
     type jsonb to text

EXCLUDING TABLE NAMES MATCHING ~<_prisma_migrations>

BEFORE LOAD DO
    $$ DROP TABLE IF EXISTS Plan CASCADE; $$,
    $$ DROP TABLE IF EXISTS Tenant CASCADE; $$

AFTER LOAD DO
    $$ VACUUM ANALYZE; $$;
```

**Exécution:**

```bash
# Direct
pgloader migration.load

# Via Docker (Windows)
docker run --rm -v ${PWD}:/data dimitri/pgloader /data/migration.load

# Avec logs détaillés
pgloader --verbose migration.load > migration.log 2>&1
```

**Avantages:**
- ⚡ Très rapide (parallélisation)
- 🔧 Conversions de types automatiques
- 📊 Logs détaillés

**Inconvénients:**
- ❌ Configuration complexe
- ❌ Pas natif Windows
- ❌ Moins de contrôle sur les erreurs

---

### Option 3: Export/Import Manuel SQL 📝

**Étape 1: Export PostgreSQL**

```bash
# Export complet
pg_dump -h localhost -U iapostemanage -d iapostemanage \
  --format=plain --no-owner --no-acl \
  --file=export.sql

# Export données uniquement
pg_dump -h localhost -U iapostemanage -d iapostemanage \
  --data-only --no-owner \
  --file=data.sql
```

**Étape 2: Conversion PostgreSQL → SQLite**

Créer `convert.py`:

```python
import re
import sys

def convert_pg_to_sqlite(pg_sql):
    """Convertit SQL PostgreSQL en SQLite"""
    
    # Remplacer les types
    replacements = {
        r'SERIAL PRIMARY KEY': 'INTEGER PRIMARY KEY AUTOINCREMENT',
        r'BIGSERIAL': 'INTEGER',
        r'TIMESTAMP WITH TIME ZONE': 'TEXT',
        r'TIMESTAMP': 'TEXT',
        r'BOOLEAN': 'INTEGER',
        r'TEXT\[\]': 'TEXT',
        r'JSONB': 'TEXT',
        r'JSON': 'TEXT',
        r'UUID': 'TEXT',
    }
    
    sqlite_sql = pg_sql
    
    for pattern, replacement in replacements.items():
        sqlite_sql = re.sub(pattern, replacement, sqlite_sql, flags=re.IGNORECASE)
    
    # Supprimer syntaxe PostgreSQL spécifique
    sqlite_sql = re.sub(r'RETURNING \*;', ';', sqlite_sql)
    sqlite_sql = re.sub(r'ON CONFLICT.*?;', ';', sqlite_sql)
    
    # Supprimer les schémas
    sqlite_sql = re.sub(r'SET search_path.*?;', '', sqlite_sql)
    
    return sqlite_sql

# Lecture et conversion
with open('export.sql', 'r') as f:
    pg_sql = f.read()

sqlite_sql = convert_pg_to_sqlite(pg_sql)

with open('export_sqlite.sql', 'w') as f:
    f.write(sqlite_sql)

print("✅ Conversion terminée: export_sqlite.sql")
```

**Étape 3: Import SQLite**

```bash
# Conversion
python convert.py

# Import
sqlite3 ./prisma/migrated.db < export_sqlite.sql

# Vérification
sqlite3 ./prisma/migrated.db "SELECT COUNT(*) FROM Tenant;"
```

---

## 🧪 Test des 3 Environnements

Notre script [test-all-databases.ts](../scripts/test-all-databases.ts) teste automatiquement:

1. **SQLite (Dev)** - Base locale de développement
2. **PostgreSQL (Docker)** - Base production Docker
3. **Cloudflare D1** - Base cloud

**Exécution:**

```bash
npx tsx scripts/test-all-databases.ts
```

**Tests effectués:**

✅ **Connexion** - Vérification de la connexion
✅ **CRUD** - Create, Read, Update, Delete
✅ **Performance** - Count, FindMany, Requêtes complexes
✅ **Isolation Tenant** - Vérification multi-tenant

**Rapport généré:**

```json
{
  "timestamp": "2026-01-21T10:30:00.000Z",
  "summary": {
    "totalTests": 12,
    "totalSuccess": 12,
    "totalDuration": 2453,
    "successRate": 100
  },
  "results": [...]
}
```

---

## 📊 Comparaison des Options

| Critère              | Script Custom | pgloader  | Export/Import |
| -------------------- | ------------- | --------- | ------------- |
| **Facilité**         | ⭐⭐⭐⭐⭐    | ⭐⭐⭐     | ⭐⭐          |
| **Vitesse**          | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐  | ⭐⭐⭐         |
| **Contrôle**         | ⭐⭐⭐⭐⭐    | ⭐⭐⭐      | ⭐⭐⭐⭐       |
| **Windows**          | ✅ Natif      | ❌ Docker | ✅ Avec Python |
| **Validation**       | ✅ Automatique| ⚠️ Manuelle| ⚠️ Manuelle  |
| **Rapport**          | ✅ JSON       | ✅ Logs    | ❌            |
| **Gros volumes**     | ⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐  | ⭐⭐          |

---

## 🎯 Workflow Recommandé

### 1️⃣ Développement Local

```bash
# Utiliser SQLite directement
npm run dev
```

### 2️⃣ Tests avec Docker PostgreSQL

```bash
# Démarrer PostgreSQL
docker-compose up -d postgres

# Appliquer migrations
DATABASE_URL="postgresql://iapostemanage:changeme@localhost:5432/iapostemanage" \
npx prisma db push

# Tester
npx tsx scripts/test-all-databases.ts
```

### 3️⃣ Migration vers Production

```bash
# Option A: Script custom (recommandé)
npx tsx scripts/migrate-postgres-to-sqlite.ts

# Option B: pgloader
pgloader migration.load

# Option C: Export/Import
pg_dump ... | python convert.py | sqlite3 migrated.db
```

### 4️⃣ Déploiement Cloudflare D1

```bash
# Créer base D1
wrangler d1 create iapostemanager-db

# Migrer données
wrangler d1 execute iapostemanager-db --file=export_sqlite.sql --remote

# Tester
npx tsx scripts/test-all-databases.ts
```

---

## ✅ Validation Complète

### Script de validation automatique

```bash
# Tester les 3 environnements
npx tsx scripts/test-all-databases.ts

# Vérifier la migration
npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run

# Migration + Validation
npx tsx scripts/migrate-postgres-to-sqlite.ts && \
npx tsx scripts/test-all-databases.ts
```

### Checklist manuelle

- [ ] Connexion SQLite OK
- [ ] Connexion PostgreSQL OK
- [ ] Connexion D1 OK
- [ ] CRUD SQLite OK
- [ ] CRUD PostgreSQL OK
- [ ] CRUD D1 OK
- [ ] Performance acceptable (<500ms)
- [ ] Isolation tenant vérifiée
- [ ] Nombre d'enregistrements identique
- [ ] Rapport de migration généré

---

## 🚨 Dépannage

### Erreur: "Cannot connect to PostgreSQL"

```bash
# Vérifier que PostgreSQL tourne
docker-compose ps

# Vérifier les credentials
docker-compose logs postgres

# Redémarrer
docker-compose restart postgres
```

### Erreur: "SQLite database locked"

```bash
# Fermer toutes les connexions
pkill -f prisma

# Supprimer le lock
rm prisma/dev.db-journal

# Vérifier WAL mode
sqlite3 prisma/dev.db "PRAGMA journal_mode;"
```

### Erreur: "Migration failed"

```bash
# Mode dry-run pour diagnostiquer
npx tsx scripts/migrate-postgres-to-sqlite.ts --dry-run

# Vérifier le rapport
cat migration-report.json

# Réessayer avec batch plus petit
BATCH_SIZE=50 npx tsx scripts/migrate-postgres-to-sqlite.ts
```

---

## 📚 Ressources

- **Script migration**: [scripts/migrate-postgres-to-sqlite.ts](../scripts/migrate-postgres-to-sqlite.ts)
- **Tests multi-DB**: [scripts/test-all-databases.ts](../scripts/test-all-databases.ts)
- **Prisma client**: [src/lib/prisma.ts](../src/lib/prisma.ts)
- **Docker config**: [docker-compose.yml](../docker-compose.yml)
- **Cloudflare D1**: [CLOUDFLARE_D1_GUIDE.md](../CLOUDFLARE_D1_GUIDE.md)

---

**Prêt pour la migration !** 🚀
