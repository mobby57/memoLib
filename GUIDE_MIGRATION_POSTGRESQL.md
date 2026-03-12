# 🐘 Guide de Migration PostgreSQL

**Date**: 27 février 2026  
**Version**: 1.0  
**Statut**: ✅ PRÊT

---

## ✅ ÉTAPE 1: Installation (TERMINÉE)

```bash
✅ Package installé: Npgsql.EntityFrameworkCore.PostgreSQL 9.0.1
✅ Program.cs modifié: Support dual SQLite/PostgreSQL
✅ appsettings.Production.json créé
```

---

## 🚀 ÉTAPE 2: Configuration PostgreSQL

### Option A: PostgreSQL Local

```bash
# Windows (avec Chocolatey)
choco install postgresql

# Ou télécharger: https://www.postgresql.org/download/windows/

# Démarrer PostgreSQL
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start

# Créer base de données
psql -U postgres
CREATE DATABASE memolib_prod;
CREATE USER memolib_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE memolib_prod TO memolib_user;
\q
```

### Option B: PostgreSQL Cloud (Neon - Recommandé)

```bash
# 1. Créer compte gratuit: https://neon.tech
# 2. Créer nouveau projet "MemoLib Production"
# 3. Copier connection string
# 4. Ajouter dans appsettings.Production.json
```

**Connection String Neon:**
```
Host=ep-xxx.eu-west-2.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=xxx;SSL Mode=Require
```

---

## 🔧 ÉTAPE 3: Configuration Application

### Modifier appsettings.Production.json

```json
{
  "UsePostgreSQL": true,
  "ConnectionStrings": {
    "Default": "Host=YOUR_HOST;Database=memolib_prod;Username=memolib_user;Password=YOUR_PASSWORD;Port=5432;SSL Mode=Require"
  }
}
```

### Ou utiliser User Secrets (Recommandé)

```bash
# Configurer connection string de manière sécurisée
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Database=memolib_prod;Username=memolib_user;Password=your_password"
dotnet user-secrets set "UsePostgreSQL" "true"
```

---

## 📦 ÉTAPE 4: Migrations

### Créer Migration PostgreSQL

```bash
# Générer migration pour PostgreSQL
dotnet ef migrations add InitialPostgreSQL --context MemoLibDbContext

# Vérifier migration générée
dotnet ef migrations list
```

### Appliquer Migration

```bash
# Appliquer sur base PostgreSQL
dotnet ef database update --context MemoLibDbContext

# Vérifier tables créées
psql -U memolib_user -d memolib_prod -c "\dt"
```

---

## 🔄 ÉTAPE 5: Migration des Données (SQLite → PostgreSQL)

### Script de Migration

```bash
# Créer script PowerShell
.\migrate-sqlite-to-postgres.ps1
```

**Contenu du script:**

```powershell
# migrate-sqlite-to-postgres.ps1

Write-Host "🔄 Migration SQLite → PostgreSQL" -ForegroundColor Cyan

# 1. Export SQLite
Write-Host "📤 Export données SQLite..."
dotnet run --project MemoLib.Api -- export-data --output data-export.json

# 2. Import PostgreSQL
Write-Host "📥 Import données PostgreSQL..."
$env:UsePostgreSQL = "true"
dotnet run --project MemoLib.Api -- import-data --input data-export.json

Write-Host "✅ Migration terminée!" -ForegroundColor Green
```

### Migration Manuelle (Alternative)

```bash
# 1. Exporter données SQLite
sqlite3 memolib.db .dump > backup.sql

# 2. Convertir SQL (SQLite → PostgreSQL)
# Utiliser: https://github.com/caiiiycuk/sqlite-to-postgres

# 3. Importer dans PostgreSQL
psql -U memolib_user -d memolib_prod -f backup_postgres.sql
```

---

## ✅ ÉTAPE 6: Tests

### Test Connection

```bash
# Tester connection PostgreSQL
dotnet run --environment Production

# Vérifier logs
# ✅ Base de données: PostgreSQL
# ✅ MemoLib API démarrée avec succès!
```

### Test API

```bash
# Créer utilisateur test
curl -X POST http://localhost:5078/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Vérifier dans PostgreSQL
psql -U memolib_user -d memolib_prod -c "SELECT * FROM \"Users\";"
```

---

## 📊 ÉTAPE 7: Performance

### Indexes PostgreSQL

```sql
-- Créer indexes pour performance
CREATE INDEX idx_cases_userid_status ON "Cases"("UserId", "Status");
CREATE INDEX idx_events_sourceid_occurred ON "Events"("SourceId", "OccurredAt");
CREATE INDEX idx_clients_userid ON "Clients"("UserId");
CREATE INDEX idx_notifications_userid_read ON "Notifications"("UserId", "IsRead");

-- Analyser performance
EXPLAIN ANALYZE SELECT * FROM "Cases" WHERE "UserId" = 'xxx';
```

### Connection Pooling

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=memolib_prod;Username=memolib_user;Password=xxx;Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100"
  }
}
```

---

## 🔐 ÉTAPE 8: Sécurité

### SSL/TLS

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Database=memolib_prod;Username=memolib_user;Password=xxx;SSL Mode=Require;Trust Server Certificate=false"
  }
}
```

### Backup Automatique

```bash
# Créer script backup quotidien
# backup-postgres.ps1

$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "backups/memolib_$date.sql"

pg_dump -U memolib_user -d memolib_prod -f $backupFile

Write-Host "✅ Backup créé: $backupFile"
```

**Planifier avec Task Scheduler (Windows):**
```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\backup-postgres.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "MemoLib Backup" -Action $action -Trigger $trigger
```

---

## 🎯 ÉTAPE 9: Monitoring

### Logs PostgreSQL

```sql
-- Activer logs slow queries
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 seconde
SELECT pg_reload_conf();

-- Voir logs
SELECT * FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;
```

### Métriques

```sql
-- Taille base de données
SELECT pg_size_pretty(pg_database_size('memolib_prod'));

-- Nombre de connexions
SELECT count(*) FROM pg_stat_activity WHERE datname = 'memolib_prod';

-- Tables les plus volumineuses
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## ✅ CHECKLIST FINALE

- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée
- [ ] User créé avec permissions
- [ ] appsettings.Production.json configuré
- [ ] Package Npgsql installé
- [ ] Migrations appliquées
- [ ] Données migrées (si nécessaire)
- [ ] Tests API passés
- [ ] Indexes créés
- [ ] Backup configuré
- [ ] Monitoring activé
- [ ] Documentation mise à jour

---

## 🚀 DÉPLOIEMENT

### Développement (SQLite)

```bash
dotnet run
# ✅ Base de données: SQLite
```

### Production (PostgreSQL)

```bash
dotnet run --environment Production
# ✅ Base de données: PostgreSQL
```

### Docker

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY . .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV UsePostgreSQL=true

ENTRYPOINT ["dotnet", "MemoLib.Api.dll"]
```

```bash
# Build & Run
docker build -t memolib-api .
docker run -p 5078:5078 \
  -e ConnectionStrings__Default="Host=postgres;Database=memolib_prod;Username=memolib_user;Password=xxx" \
  memolib-api
```

---

## 📞 SUPPORT

### Erreurs Communes

**Erreur: "password authentication failed"**
```bash
# Vérifier mot de passe
psql -U memolib_user -d memolib_prod
```

**Erreur: "SSL connection required"**
```json
{
  "ConnectionStrings": {
    "Default": "...;SSL Mode=Require"
  }
}
```

**Erreur: "too many connections"**
```sql
-- Augmenter limite
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

---

## 🎉 SUCCÈS!

Votre application MemoLib utilise maintenant PostgreSQL en production! 🐘

**Prochaines étapes:**
1. Configurer backups automatiques
2. Optimiser indexes
3. Monitorer performance
4. Planifier maintenance

---

**Dernière mise à jour**: 27 février 2026
