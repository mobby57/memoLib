# 🚀 PLAN RÉSOLUTION - BLOCAGE P0 MEMOLIB

## 📋 RÉSUMÉ

**Problème** : Désynchronisation PostgreSQL ↔️ Prisma sur table `AccessGrant`
- PostgreSQL actuel : 6 colonnes
- Prisma schema requis : 10 colonnes
- **Impact** : Routes d'invitation échoueront en production

**Solution** : Migration SQL appliquée
- Fichier : `prisma/migrations/20261117235600_fix_access_grant_schema/migration.sql`
- Statut : ✅ Créée et prête à appliquer
- Durée : ~2 minutes d'exécution

---

## 🎯 ÉTAPES À EXÉCUTER

### **ÉTAPE 1 : Vérifier que le fichier migration existe**

```bash
ls -la prisma/migrations/20261117235600_fix_access_grant_schema/
```

✅ **Résultat attendu** :
```
-rw-r--r-- migration.sql
```

---

### **ÉTAPE 2 : Exécuter la migration en Neon**

**Option A : Via Neon Console UI** (recommandé)

1. Ouvrir [Neon Console](https://console.neon.tech)
2. Sélectionner le projet memolib-production
3. Aller dans **SQL Editor**
4. Ouvrir `DIAGNOSTIC_POSTGRESQL.sql` → exécuter les 7 blocs de diagnostic
5. Prendre un **snapshot de sauvegarde** (Settings → Backups → Create)
6. Ouvrir `prisma/migrations/20261117235600_fix_access_grant_schema/migration.sql`
7. **Exécuter** la migration
8. Vérifier les résultats

**Option B : Via psql local** (si WSL configuré)

```bash
export DATABASE_URL="postgresql://user:pass@host/memolib"
psql $DATABASE_URL < prisma/migrations/20261117235600_fix_access_grant_schema/migration.sql
```

---

### **ÉTAPE 3 : Valider que le schéma est synchronized**

```sql
-- A) Vérifier les colonnes AccessGrant
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'AccessGrant' 
ORDER BY ordinal_position;
```

✅ **Résultat attendu** : 10 colonnes
- `id`, `tenantId`, `invitationId`, `clientUserId`
- `dossierId`, `status`, `expiresAt`, `revokedAt`
- `createdAt`, `updatedAt`

```sql
-- B) Vérifier les FK (Foreign Keys)
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'AccessGrant' AND constraint_type = 'FOREIGN KEY';
```

✅ **Résultat attendu** : 4+ FK
- `AccessGrant_tenantId_fkey`
- `AccessGrant_invitationId_tenantId_fkey`
- `AccessGrant_clientUserId_fkey`
- `AccessGrant_dossierId_fkey`

```sql
-- C) Vérifier l'enum
SELECT typname, array_agg(enumlabel) as values 
FROM pg_type 
LEFT JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid 
WHERE typname = 'AccessGrantStatus' 
GROUP BY typname;
```

✅ **Résultat attendu** :
```
AccessGrantStatus | {ACTIVE,REVOKED,EXPIRED}
```

---

### **ÉTAPE 4 : Compiler et tester localement**

```bash
# WSL / Local
cd /mnt/c/Users/moros/Desktop/PROD/memolib-production  # or C:\ on Windows

# Générer le Prisma client avec le nouveau schéma
npx prisma generate

# Compiler TypeScript
npm run build

# Exécuter les tests
npm test -- --testPathPattern="invitation|access"
```

✅ **Résultat attendu** :
- Pas d'erreurs de compilation
- Pas d'erreurs Prisma
- Tests passent (si existants)

---

### **ÉTAPE 5 : Merger et déployer**

```bash
# Git
git add prisma/migrations/20261117235600_fix_access_grant_schema/migration.sql
git commit -m "fix(db): sync PostgreSQL AccessGrant schema with Prisma

- Add missing columns: dossierId, status, updatedAt, tenantId
- Create AccessGrantStatus enum (ACTIVE, REVOKED, EXPIRED)
- Add 4 foreign key constraints
- Add performance indexes
- Fixes #go-live-blocker-P0"

git push origin main
```

**Déploiement automatique** (si CI/CD est configuré) :
- GitHub Actions → auto-deploy
- Ou déployer manuellement sur Vercel/Railway/Render

---

## ✅ CHECKLIST DE VALIDATION

### Avant migration
- [ ] Snapshot Neon créé
- [ ] Diagnostic SQL exécuté (7 blocs)
- [ ] Fichier migration vérifié

### Pendant migration
- [ ] Migration s'exécute sans erreur
- [ ] 0 contrainte FK en doublon
- [ ] Tables mises à jour

### Après migration
- [ ] 10 colonnes AccessGrant visibles
- [ ] 4+ FK présentes
- [ ] Enum AccessGrantStatus créé
- [ ] Build local réussit
- [ ] Tests passent
- [ ] Pas d'erreur Prisma

### Déploiement
- [ ] Code mergé en main
- [ ] CI/CD exécuté
- [ ] Déploiement vers prod OK
- [ ] Logs prod = pas d'erreur
- [ ] Routes invitation testées

---

## 🔍 DIAGNOSTIC AVANT/APRÈS

### **AVANT Migration**

```
PostgreSQL AccessGrant:
├── 6 colonnes seulement
├── 0 FK contraintes
├── Enum AccessGrantStatus ❌ MANQUANT
└── Status = VARCHAR au lieu d'ENUM

Prisma schema.prisma:
├── 10 colonnes définies
├── 4 FK requises
├── Enum AccessGrantStatus défini ✅
└── Status = AccessGrantStatus ENUM

❌ DESYNCHRONISATION = Routes échouent
```

### **APRÈS Migration**

```
PostgreSQL AccessGrant:
├── 10 colonnes ✅
├── 4 FK contraintes ✅
├── Enum AccessGrantStatus créé ✅
└── Status = AccessGrantStatus ENUM ✅

Prisma schema.prisma:
├── 10 colonnes définies ✅
├── 4 FK requises ✅
├── Enum AccessGrantStatus défini ✅
└── Status = AccessGrantStatus ENUM ✅

✅ SYNCHRONIZED = Routes fonctionnent
```

---

## 🚨 POINTS CRITIQUES

### À faire IMMÉDIATEMENT ⏰
1. Exécuter DIAGNOSTIC_POSTGRESQL.sql (confirmera le diagnostic)
2. Créer snapshot Neon (sécurité)
3. Lire le plan avant d'exécuter la migration

### À NE PAS FAIRE ❌
- ❌ N'exécutez pas la migration 2x (risque de contrainte en doublon)
- ❌ Ne suppresssez pas le snapshot avant 24h de stabilité
- ❌ Ne modifiez pas schema.prisma manuellement sans migration

### Rollback si problème 🔄
```sql
-- Revenir à la version précédente
-- (si snapshot créé, utiliser Neon Restore)
DROP TABLE IF EXISTS "AccessGrant" CASCADE;
DROP TYPE IF EXISTS "AccessGrantStatus";
-- Puis redéployer depuis snapshot
```

---

## 📊 TIMELINE

| Étape | Durée | Cumul |
|-------|-------|-------|
| Diagnostic SQL | 2 min | 2 min |
| Migration SQL | 2 min | 4 min |
| Validation | 3 min | 7 min |
| Build local | 10 min | 17 min |
| Tests | 5 min | 22 min |
| Git + Merge | 5 min | 27 min |
| Déploiement | 10 min | 37 min |
| **TOTAL** | - | **~40 min** |

---

## 🎓 QUOI VÉRIFIER EN PROD

Après déploiement, surveiller :

```bash
# Logs d'erreur
tail -f logs/production.log | grep -i "error\|access"

# Health check
curl https://memolib.prod/api/health

# Test route invitation
POST /api/invitations/accept
{
  "token": "test",
  "email": "test@cabinet.fr"
}
# Doit retourner 200 OK (et pas "column not found")
```

---

## 📞 Support

Si la migration échoue :
1. Vérifier l'erreur exacte
2. Chercher contrainte en doublon (IF NOT EXISTS prévient ça)
3. Restaurer depuis snapshot si nécessaire
4. Re-exécuter migration avec corrections

---

**Migration créée par** : Copilot Audit Script
**Date** : 2026-11-17 23:56:00
**Blocage** : P0 - Production blocker
**Status** : ✅ Prêt pour déploiement
