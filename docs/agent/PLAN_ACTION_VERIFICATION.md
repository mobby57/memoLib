# 🛑 PLAN D'ACTION - VÉRIFICATION & CORRECTION SÉCURISÉE

**Statut** : En attente de diagnostic  
**Risque** : 🔴 CRITIQUE - Ne pas exécuter sans vérification  
**Deadline** : URGENT (blocage production)

---

## 📋 PHASE 1 : DIAGNOSTIC (2 minutes)

### Étape 1.1 : Accéder à PostgreSQL

**Option A : Via Neon SQL Editor (recommandé)**

1. Aller sur https://console.neon.tech/
2. Ouvrir le SQL Editor pour le projet MemoLib
3. Copier-coller le contenu de `DIAGNOSTIC_POSTGRESQL.sql`
4. Exécuter chaque bloc et **noter les résultats**

**Option B : Via `psql` local**

```bash
# Si DATABASE_URL est disponible localement
psql $DATABASE_URL -f DIAGNOSTIC_POSTGRESQL.sql
```

**Option C : Via Neon CLI**

```bash
# Si Neon CLI est installé
neon branch current
neon database list
# Puis accéder au SQL Editor
```

### Étape 1.2 : Enregistrer les résultats

**À chaque bloc, répondre à ces questions :**

| Bloc | Question | Réponse attendue | Votre résultat |
|------|----------|------------------|---|
| 1 | Colonnes dans AccessGrant | 6 (sans dossierId, status, updatedAt) | [ ] |
| 2 | FK dans AccessGrant | 0 | [ ] |
| 3 | Enum AccessGrantStatus | N'existe pas | [ ] |
| 4 | Index dans AccessGrant | 2 (invitationId_key, clientUserId_idx) | [ ] |
| 5 | Contraintes UNIQUE | 1 (invitationId_key) | [ ] |
| 6 | Tables existent | ✅ Toutes 4 | [ ] |
| 7 | Données existantes | 0 lignes partout | [ ] |

---

## 🎯 PHASE 2 : ANALYSE (5 minutes)

### Résultat A : Migration N'A PAS ÉTÉ APPLIQUÉE (SCÉNARIO LE PLUS PROBABLE)

```
AccessGrant a 6 colonnes  ← ❌
Pas de FK                 ← ❌
Pas d'enum                ← ❌
```

**ACTION IMMÉDIATE** :
- ✅ Exécuter la migration SQL
- ✅ Vérifier après exécution
- ✅ Redémarrer l'application

---

### Résultat B : Migration A ÉTÉ PARTIELLEMENT APPLIQUÉE

```
AccessGrant a 9+ colonnes  ← ✅
Mais seulement 1-2 FK       ← ⚠️
```

**ACTION IMMÉDIATE** :
- ✅ Identifier ce qui manque
- ✅ Créer une migration de correction
- ✅ Vérifier l'intégrité
- ✅ Redémarrer l'application

---

### Résultat C : Migration A ÉTÉ COMPLÈTEMENT APPLIQUÉE

```
AccessGrant a 10 colonnes  ← ✅
3 FK existant               ← ✅
Enum existe                 ← ✅
```

**ACTION IMMÉDIATE** :
- ✅ Exécuter `npx prisma generate`
- ✅ Exécuter `npm run build`
- ✅ Exécuter les tests
- ✅ Vérifier la route `/api/invitations/accept`

---

## 🛠️ PHASE 3 : CORRECTION (selon le résultat)

### **Si Résultat A ou B :** Migration sécurisée

#### Étape 3.1 : Créer une sauvegarde Neon

```bash
# Depuis Neon CLI
neon branches create --name backup-$(date +%s)
```

**OU** : Via UI Neon → Branches → Create branch

#### Étape 3.2 : Appliquer la migration

**Option A : Via Neon SQL Editor (RECOMMANDÉ)**

1. Copier tout le contenu de `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql`
2. L'exécuter bloc par bloc dans le SQL Editor
3. **Vérifier après chaque bloc** qu'il n'y a pas d'erreur
4. Si erreur : s'arrêter et diagnostiquer

**Option B : Via `prisma migrate`**

```bash
# Copier la migration dans le dossier approprié
mkdir -p prisma/migrations/20261117000000_fix_access_grant_schema
cp MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql prisma/migrations/20261117000000_fix_access_grant_schema/migration.sql

# Appliquer la migration
npx prisma migrate deploy

# Vérifier
npx prisma migrate status
```

**Option C : Via psql direct**

```bash
psql $DATABASE_URL -f MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql
```

#### Étape 3.3 : Vérifier après migration

**Exécuter à nouveau les diagnostics** (bloc 1-7)

**Résultat attendu** :
- ✅ 10 colonnes dans AccessGrant (dont dossierId, status, updatedAt)
- ✅ 3 FK existant
- ✅ Enum AccessGrantStatus existe
- ✅ Indices OK

#### Étape 3.4 : Synchroniser Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Vérifier la validation
npx prisma validate

# Si tout OK :
npm run build
npm run test
```

---

## ✅ PHASE 4 : VALIDATION (10 minutes)

### Étape 4.1 : Tests locaux

```bash
# 1. Vérifier que build fonctionne
npm run build

# Output attendu: ✓ Sans erreur TypeScript

# 2. Vérifier les tests
npm run test -- accept.test.ts

# Output attendu: ✓ Les tests de invitation passent

# 3. Vérifier Prisma Studio
npx prisma studio

# Action: Ouvrir AccessGrant, Invitation, Dossier
# → Vérifier les colonnes et relations
```

### Étape 4.2 : Tests de route

**Via curl ou Postman** :

```bash
# Créer une invitation
curl -X POST http://localhost:3000/api/dossiers/[dossierId]/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com"}'

# Simuler l'acceptation
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"[token-de-linvitation]"}'

# Output attendu: { "success": true, "dossierId": "..." }
```

### Étape 4.3 : Vérifier les logs

```bash
# Chercher les erreurs de migration
grep -i "error\|fail\|constraint" .logs

# Chercher les warnings
grep -i "warning\|deprecated" .logs

# Résultat attendu: Aucun error relatif à AccessGrant
```

---

## 🚀 PHASE 5 : DÉPLOIEMENT (selon résultat validation)

### Si validation OK ✅

```bash
# 1. Merger les changements
git add prisma/schema.prisma src/app/api/invitations/accept/route.ts
git commit -m "fix(invitation): synchronize AccessGrant schema with Prisma

- Add dossierId column to AccessGrant
- Add status and updatedAt columns
- Add FK constraints for data integrity
- Verify email is Clerk-verified before accepting

Fixes P0 migration issue and P1 security vulnerability"

# 2. Push vers main
git push origin main

# 3. Déployer en staging
npm run deploy:staging

# 4. Vérifier en staging
# → Tester le parcours d'invitation complet
# → Vérifier les logs

# 5. Déployer en production
npm run deploy:production

# 6. Monitorer
# → Vérifier que aucune erreur dans Sentry
# → Vérifier les logs d'application
# → Tester avec un cabinet pilote
```

### Si validation ÉCHOUE ❌

```bash
# 1. Identifier l'erreur
# → Lire les logs build
# → Lire les erreurs test
# → Lancer le diagnostic à nouveau

# 2. Options:

# Option A : Revenir à la branche précédente
git reset --hard HEAD~1

# Option B : Créer une branche de correction
git checkout -b fix/invitation-schema
# → Identifier le problème
# → Corriger
# → Re-tester
# → Merger après validation

# Option C : Contacter support
# → Neon support si problème DB
# → Prisma support si problème schéma
```

---

## 📊 TIMELINE

| Phase | Durée | Responsable | Checkpoint |
|-------|-------|-------------|-----------|
| **1. Diagnostic** | 2 min | 👤 Vous | Résultats SQL enregistrés |
| **2. Analyse** | 5 min | 👤 Vous | Scénario identifié (A/B/C) |
| **3. Correction** | 5 min | 👤 Vous | Migration exécutée sans erreur |
| **4. Validation** | 10 min | 👤 Vous | Build OK + Tests OK |
| **5. Déploiement** | 10 min | 👤 Vous | En production, monitored |
| **TOTAL** | **~30 min** | | |

---

## ⚠️ POINTS CRITIQUES

### À ABSOLUMENT VÉRIFIER :

- [ ] **Pas de perte de données** : DIAGNOSTIC montrera si données existent
- [ ] **Pas d'orphelins** : Migration vérifiera les FK avant ajout
- [ ] **Pas de conflits** : Vérifier que pas 2 migrations simultanées
- [ ] **Pas de rollback accidentel** : Garder un snapshot Neon
- [ ] **Logs monitored** : Vérifier Sentry après déploiement

### À NE PAS FAIRE :

❌ Exécuter la migration **sans vérification diagnostic**  
❌ Pousser en production **sans test local**  
❌ Supprimer le snapshot **avant 24h de stabilité en prod**  
❌ Modifier `schema.prisma` **sans migration SQL correspondante**  
❌ Oublier `npx prisma generate` **après migration**

---

## 📞 SUPPORT

| Problème | Solution |
|----------|----------|
| Diagnostic SQL échoue | Utiliser Neon SQL Editor (pas CLI) |
| Migration génère erreur FK | Vérifier orphelins avec le DIAGNOSTIC |
| Build échoue TypeScript | Exécuter `npx prisma generate` |
| Route renvoie 500 | Lire les logs Sentry |
| Test échoue | Vérifier `npm run test -- -t "invitation"` |

---

## 🎯 APRÈS SUCCÈS

**Documentation à mettre à jour** :

1. ✅ Ajouter dans `CHANGELOG.md` :
   ```
   ## [Fixed]
   - Fix: AccessGrant schema migration (P0 critical)
   - Security: Email verification for invitation acceptance (P1)
   ```

2. ✅ Ajouter dans `docs/MIGRATION.md` :
   ```
   ## AccessGrant Schema Migration (2026-11-17)
   
   **What changed**: 3 new columns + 3 FK constraints
   **Why**: Synchronize PostgreSQL with Prisma schema
   **How**: Automatic via Prisma migrations
   ```

3. ✅ Notifier l'équipe :
   ```
   ✅ MemoLib invitation system now production-ready
   ✅ Security verification for client email
   ✅ Data integrity with FK constraints
   ```

---

**Prochaine action : Exécutez le DIAGNOSTIC_POSTGRESQL.sql et signalez les résultats. 🚀**
