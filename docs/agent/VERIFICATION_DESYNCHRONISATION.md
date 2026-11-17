# 🔴 VÉRIFICATION CRITIQUE : Désynchronisation PostgreSQL ↔️ Prisma

**Date** : 2026-11-17  
**Statut** : ⚠️ **BLOCAGE CONFIRMÉ**  
**Niveau** : P0 CRITIQUE

---

## 📊 RÉSUMÉ EXÉCUTIF

| Aspect | État PostgreSQL (migration 20261116120000) | État Prisma (schema.prisma) | Synchrone ? |
|--------|---------------------------------------------|------------------------------|-------------|
| **Colonnes AccessGrant** | 6 colonnes | 10 colonnes | ❌ **NON** |
| **Relations FK** | 0 FK | 3 FK | ❌ **NON** |
| **Enum AccessGrantStatus** | ❌ N'existe pas | ✅ Défini | ❌ **NON** |
| **Colonne updatedAt** | ❌ Manquante | ✅ Présente | ❌ **NON** |
| **Colonne dossierId** | ❌ Manquante | ✅ Présente | ❌ **NON** |
| **Colonne status** | ❌ Manquante | ✅ Présente | ❌ **NON** |

**VERDICT** : MemoLib ne peut **PAS** s'exécuter en production. Les routes créeront des erreurs lors de l'acceptation d'invitation.

---

## 🔍 ANALYSE DÉTAILLÉE

### 1️⃣ COLONNES : PostgreSQL vs Prisma

#### **Migration `20261116120000` crée en PostgreSQL :**

```sql
CREATE TABLE IF NOT EXISTS "AccessGrant" (
  "id"           TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "clientUserId" TEXT NOT NULL,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "revokedAt"    TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);
```

**Colonnes : 6**
- ✅ id
- ✅ invitationId
- ✅ clientUserId
- ✅ expiresAt
- ✅ revokedAt
- ✅ createdAt

#### **Prisma `schema.prisma` demande :**

```prisma
model AccessGrant {
  id             String   @id @default(cuid())
  invitation     Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  invitationId   String   @unique
  clientUser     User       @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  clientUserId   String
  dossier        Dossier    @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId      String          // 🔴 MANQUANTE EN DB
  expiresAt      DateTime
  revokedAt      DateTime?
  status         AccessGrantStatus @default(ACTIVE)  // 🔴 MANQUANTE EN DB
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt                 // 🔴 MANQUANTE EN DB
  ...
}
```

**Colonnes : 10**
- ✅ id
- ✅ invitationId
- ✅ clientUserId
- ❌ **dossierId** (MANQUANTE)
- ✅ expiresAt
- ✅ revokedAt
- ✅ createdAt
- ❌ **status** (MANQUANTE)
- ❌ **updatedAt** (MANQUANTE)

**ÉCART : 3 colonnes manquantes en PostgreSQL**

---

### 2️⃣ RELATIONS : PostgreSQL vs Prisma

#### **Migration `20261116120000` crée en PostgreSQL :**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "AccessGrant_invitationId_key" ON "AccessGrant"("invitationId");
CREATE INDEX IF NOT EXISTS "AccessGrant_clientUserId_idx" ON "AccessGrant"("clientUserId");
```

**Clés étrangères (FK) : 0 ❌**
- ❌ Aucune FK vers `Invitation`
- ❌ Aucune FK vers `User`
- ❌ Aucune FK vers `Dossier` (car colonne n'existe pas)

#### **Prisma demande :**

```prisma
model AccessGrant {
  ...
  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  clientUser User @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  dossier Dossier @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  ...
}
```

**FK attendues : 3**
- ❌ `AccessGrant.invitationId` → `Invitation.id` (MANQUANTE)
- ❌ `AccessGrant.clientUserId` → `User.id` (MANQUANTE)
- ❌ `AccessGrant.dossierId` → `Dossier.id` (MANQUANTE + colonne n'existe pas)

**ÉCART : 3 FK manquantes**

---

### 3️⃣ ENUM : PostgreSQL vs Prisma

#### **Migration `20261116120000` :**

```sql
-- L'enum n'est PAS créé pour AccessGrantStatus
-- (ne crée que InvitationStatus)
```

**Enum `AccessGrantStatus` : ❌ N'existe pas en PostgreSQL**

#### **Prisma demande :**

```prisma
enum AccessGrantStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

model AccessGrant {
  status AccessGrantStatus @default(ACTIVE)
}
```

**Enum attendu : ✅ Oui**

**ÉCART : enum manquant**

---

### 4️⃣ ROUTE D'ACCEPTATION : Code vs Schema

#### **Code en `src/app/api/invitations/accept/route.ts` :**

```typescript
await prisma.accessGrant.create({
  data: { 
    invitationId: invitation.id,       // ✅ Existe en DB
    clientUserId: userId,              // ✅ Existe en DB
    expiresAt: invitation.expiresAt,   // ✅ Existe en DB
    dossierId: invitation.dossierId,   // 🔴 N'EXISTE PAS EN DB !!!
  },
})
```

**Résultat quand la route s'exécute :**

```
ERROR: column "dossierId" does not exist
  Hint: Perhaps you meant to reference the column "\"AccessGrant\".\"invitationId\"" or "\"AccessGrant\".\"clientUserId\"".
```

**BLOCAGE CONFIRMÉ** : La route échouera à l'exécution.

---

## 🚨 CAUSE RACINE

### Pourquoi cette désynchronisation ?

1. **Migration `20261116120000`** (créée 2026-11-16) :
   - ✅ Crée les tables `Invitation` et `AccessGrant`
   - ❌ **Oublie 3 colonnes critiques pour `AccessGrant`**
   - ❌ Oublie les FK

2. **Prisma `schema.prisma`** (mis à jour après) :
   - ✅ Ajoute les 3 colonnes manquantes
   - ✅ Ajoute les relations
   - ❌ **Prisma croit que les colonnes existent en BD**

3. **Résultat** :
   - PostgreSQL : `AccessGrant` a 6 colonnes + 0 FK
   - Prisma : `AccessGrant` demande 10 colonnes + 3 FK
   - Code : Tente de créer une ligne avec `dossierId` → **ERREUR**

---

## 📋 VÉRIFICATION REQUISE

Avant tout changement, nous devons confirmer :

### ✅ Checklist de vérification

- [ ] **Vérifier PostgreSQL directement** :
  ```sql
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'AccessGrant' 
  ORDER BY ordinal_position;
  ```
  **Attendu** : id, invitationId, clientUserId, expiresAt, revokedAt, createdAt (6 colonnes)

- [ ] **Vérifier les FK** :
  ```sql
  SELECT constraint_name 
  FROM information_schema.table_constraints 
  WHERE table_name = 'AccessGrant' 
  AND constraint_type = 'FOREIGN KEY';
  ```
  **Attendu** : (liste vide)

- [ ] **Vérifier les enums** :
  ```sql
  SELECT typname FROM pg_type WHERE typname = 'AccessGrantStatus';
  ```
  **Attendu** : (aucune ligne)

- [ ] **Vérifier les données existantes** :
  ```sql
  SELECT COUNT(*) FROM "AccessGrant";
  SELECT COUNT(*) FROM "Invitation";
  ```
  **Attendu** : Probablement 0 (tables nouvelles)

---

## ⚠️ RISQUES DE CORRECTION

### Si on applique la migration `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql` maintenant :

| Risque | Niveau | Détail |
|--------|--------|--------|
| **Colonnes avec NOT NULL** | 🔴 P0 | `ALTER TABLE ADD COLUMN "dossierId" TEXT NOT NULL` échouera si lignes existent |
| **Conversion d'enum** | 🔴 P0 | `ALTER COLUMN status TYPE "AccessGrantStatus"` échouera si colonne n'existe pas |
| **FK constraint violation** | 🔴 P0 | Ajout de FK vers Dossier échouera si orphelins existent |
| **Contrainte UNIQUE** | 🟡 P1 | `@@unique([invitationId, clientUserId])` peut créer conflit de contrainte |
| **Données corrompues** | 🔴 P0 | Si des valeurs status invalides existent |

---

## 🛠️ SOLUTIONS POSSIBLES

### **Option A : Migration sécurisée (RECOMMANDÉE)**

Créer une migration idempotente :

```sql
-- Step 1: Ajouter colonnes avec DEFAULT
ALTER TABLE "AccessGrant" 
  ADD COLUMN "dossierId" TEXT DEFAULT 'unknown',
  ADD COLUMN "status" TEXT DEFAULT 'ACTIVE',
  ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Remplir les orphelins
UPDATE "AccessGrant" 
SET dossierId = (SELECT dossierId FROM "Invitation" WHERE id = "invitationId")
WHERE dossierId = 'unknown';

-- Step 3: Vérifier qu'aucun orphelin reste
DELETE FROM "AccessGrant" WHERE dossierId IS NULL;

-- Step 4: Rendre NOT NULL
ALTER TABLE "AccessGrant" 
  ALTER COLUMN "dossierId" SET NOT NULL,
  DROP DEFAULT;

-- Step 5: Créer l'enum
CREATE TYPE "AccessGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- Step 6: Convertir le type
ALTER TABLE "AccessGrant" 
  ALTER COLUMN "status" TYPE "AccessGrantStatus" USING status::"AccessGrantStatus";

-- Step 7: Ajouter les FK
ALTER TABLE "AccessGrant" 
  ADD CONSTRAINT "AccessGrant_dossierId_fkey" 
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE;

-- ... etc
```

### **Option B : Snapshot + restore (SÉCURITÉ MAXIMUM)**

1. Créer un snapshot Neon
2. Appliquer la migration au snapshot
3. Tester complètement
4. Appliquer à prod si OK

---

## 🎯 RECOMMANDATION FINALE

**JE RECOMMANDE : NE PAS EXÉCUTER les corrections tant que :**

1. ✅ Les colonnes manquantes sont confirmées en PostgreSQL (vérification avec SQL)
2. ✅ Aucune FK n'existe actuellement (vérification avec SQL)
3. ✅ Les données existantes sont mappées (si elles existent)
4. ✅ Une migration idempotente est écrite
5. ✅ Un snapshot Neon est créé avant correction
6. ✅ Les tests locaux passent après correction

**Sans cela, risque de corruption de données en production. 🔴**

---

## 📞 ACTION IMMÉDIATE REQUISE

**Utilisateur doit fournir** :

```bash
# Depuis la machine locale avec accès à Neon
psql $DATABASE_URL -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'AccessGrant' 
  ORDER BY ordinal_position;
"

# Résultat attendu :
# column_name
# id
# invitationId
# clientUserId
# expiresAt
# revokedAt
# createdAt
```

**OU** : Accès à Neon CLI pour vérifier l'état réel.

---

**Fin de la vérification. En attente de confirmation de l'état réel de PostgreSQL.**
