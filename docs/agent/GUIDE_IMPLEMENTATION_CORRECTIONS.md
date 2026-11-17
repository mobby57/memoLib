# 🔧 GUIDE D'IMPLÉMENTATION - Corrections P0, P1, P2

**Date** : 2026-11-17  
**Statut** : Corrections en cours  
**Blocage** : Ne pas déployer tant que P0 n'est pas appliqué

---

## ✅ Corrections appliquées

### ✅ 1. Modifications de code (P1.1 + P1.2 + P2.1)

#### P1.1 : Vérification email Clerk vérifié
**Fichier** : `src/app/api/invitations/accept/route.ts`
**Status** : ✅ APPLIQUÉ

```typescript
// AVANT (risque : emailAddresses[0] non-vérifié)
const userEmail = user.emailAddresses[0]?.emailAddress;
if (userEmail !== invitation.email) {
  return new NextResponse('This invitation was not sent to your email address', { status: 403 });
}

// APRÈS (sécurisé : vérification + email matching)
const verifiedEmail = user.emailAddresses.find(
  (email) => email.verification?.status === 'verified' && email.emailAddress === invitation.email
);

if (!verifiedEmail) {
  return new NextResponse(
    'Please verify the email address that received this invitation before accepting it.',
    { status: 403 }
  );
}
```

**Vérification** : ✅ Teste que l'email est vérifié ET correspond à l'invitation

---

#### P1.2 : Désactiver ALLOW_QUICK_PROVISION en prod
**Fichier** : `src/app/api/dossiers/quick-invite/route.ts`
**Status** : ✅ APPLIQUÉ

```typescript
const ALLOW_AUTO_PROVISION =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_QUICK_PROVISION === 'true';

// ⚠️ Security warning if quick provisioning is enabled in production
if (ALLOW_AUTO_PROVISION && process.env.NODE_ENV === 'production') {
  console.warn(
    '⚠️  SECURITY WARNING: Quick provisioning is enabled in production. ' +
    'This endpoint should be restricted or disabled. ' +
    'Set ALLOW_QUICK_PROVISION=false to disable.'
  );
}
```

**Vérification** : ✅ Affiche un warning si activé en production

---

#### P2.1 : Relations Dossier → Invitation et AccessGrant
**Fichier** : `prisma/schema.prisma` (modèle Dossier)
**Status** : ✅ APPLIQUÉ

```prisma
model Dossier {
  // ... existing fields ...
  
  // ✅ P2-1: Relations for Invitations and AccessGrants
  invitations        Invitation[]
  accessGrants       AccessGrant[]
  
  // ... rest of model ...
}
```

**Vérification** : ✅ Permet les requêtes inverse (trouver invitations d'un dossier)

---

#### P5.1 : User relations for Invitations
**Fichier** : `prisma/schema.prisma` (modèle User)
**Status** : ✅ APPLIQUÉ (session précédente)

```prisma
model User {
  // ... existing fields ...
  
  // ✅ P1-5: Relations for Invitations
  invitationsCreated Invitation[] @relation("InvitationsCreated")
  clientAccess       AccessGrant[] @relation("ClientAccess")
  
  @@index([role])
}
```

---

### 🚨 P0 : Migration SQL — À APPLIQUER MANUELLEMENT

**Fichier** : `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql` (créé dans le répertoire racine)

**Raison** : Le dossier `prisma/migrations/20261117_fix_access_grant_schema/` ne peut pas être créé par les outils disponibles. Vous devez :

#### Option A : Utiliser Prisma CLI (RECOMMANDÉ)
```bash
# 1. Créer manuellement le dossier de migration
mkdir -p prisma/migrations/20261117035000_fix_access_grant_schema

# 2. Copier le fichier migration.sql
cp MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql prisma/migrations/20261117035000_fix_access_grant_schema/migration.sql

# 3. Appliquer la migration
prisma migrate deploy

# 4. Vérifier le schéma
prisma db push
prisma studio  # Optionnel : vérifier les FK dans l'UI
```

#### Option B : Utiliser un client SQL directement
```bash
# Si vous avez accès à PostgreSQL directement :
psql -U $DB_USER -d $DB_NAME -h $DB_HOST -f MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql
```

#### Option C : Via Neon Dashboard (si Neon est utilisé)
1. Aller sur dashboard.neon.tech
2. Sélectionner le projet et la branche `main`
3. Ouvrir "SQL Editor"
4. Copier-coller le contenu de `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql`
5. Exécuter

---

## 🎯 Checklist d'implémentation

### ✅ Phase 1 : Code changes (FAIT)
- [x] P1.1 : Email Clerk vérifié dans `/api/invitations/accept`
- [x] P1.2 : Warning `ALLOW_QUICK_PROVISION` en prod
- [x] P2.1 : Relations Dossier → Invitation / AccessGrant
- [x] P5.1 : Relations User pour invitations (session antérieure)

### 🔴 Phase 2 : Migration SQL (À FAIRE AVANT PRODUCTION)
- [ ] Créer le dossier `prisma/migrations/20261117035000_fix_access_grant_schema`
- [ ] Copier `migration.sql` dans ce dossier
- [ ] Exécuter `prisma migrate deploy` OU copier-coller le SQL dans votre DB
- [ ] Vérifier que les colonnes et FK existent :
  ```sql
  -- Vérification des colonnes AccessGrant
  SELECT column_name, data_type FROM information_schema.columns 
  WHERE table_name = 'AccessGrant' 
  ORDER BY ordinal_position;
  
  -- Vérification des FK
  SELECT constraint_name, table_name FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' AND table_name = 'AccessGrant';
  ```

### 🟡 Phase 3 : Tests (À FAIRE AVANT GO-LIVE)
- [ ] Test happy path : avocat crée invitation → client accepte → accès au dossier
- [ ] Test concurrence : 2 clients acceptent la même invitation simultanément
- [ ] Test expiration : accepter une invitation après son expiration
- [ ] Test email erroné : accepter avec email différent de l'invitation
- [ ] Test tenant mismatch : vérifier qu'un client hors-tenant ne peut pas accepter
- [ ] Test email non-vérifié : Clerk avec `emailAddresses[0]` non-verified, puis accepter invitation

### 🟢 Phase 4 : Vérification finale
- [ ] Schema Prisma généré : `prisma generate`
- [ ] Typecheck TypeScript : `tsc --noEmit`
- [ ] Build Next.js : `npm run build`
- [ ] Seed data (si nécessaire) : `npx prisma db seed`

---

## 📋 Détail des colonnes ajoutées par la migration

| Table | Colonne | Type | Contrainte | Raison |
|---|---|---|---|---|
| **AccessGrant** | `dossierId` | TEXT NOT NULL | FK → Dossier | Lien vers le dossier partagé |
| **AccessGrant** | `status` | enum ACTIVE/REVOKED/EXPIRED | DEFAULT ACTIVE | Statut de l'accès |
| **AccessGrant** | `updatedAt` | TIMESTAMP(3) | DEFAULT now() | Audit trail |
| **Invitation** | (FK) `dossierId` | - | FK → Dossier | Lien vers le dossier invité |
| **Invitation** | (FK) `lawyerId` | - | FK → User | Lien vers l'avocat qui crée |
| **AccessGrant** | (FK) `invitationId` | - | FK → Invitation | Lien vers l'invitation |
| **AccessGrant** | (FK) `clientUserId` | - | FK → User | Lien vers le client acceptant |
| **AccessGrant** | (FK) `dossierId` | - | FK → Dossier | Lien vers le dossier accédé |

---

## ⚠️ Risques connus

| Risque | Niveau | Mitigation |
|---|---|---|
| Migration échoue si colonne existe déjà | Faible | Utiliser `IF NOT EXISTS` ou `IF` checks |
| FK constraint violation si données orphelines | Moyen | Vérifier qu'aucune AccessGrant n'existe avant migration |
| Performance de la migration sur large table | Faible | La table AccessGrant est vide (nouvellement créée) |
| Rollback compliqué si migration échoue | Moyen | Prendre un snapshot PostgreSQL avant d'appliquer |

---

## 🔍 Vérification post-migration

**Après avoir appliqué la migration, vérifier :**

```sql
-- 1. Vérifier que les colonnes existent
SELECT * FROM information_schema.columns 
WHERE table_name = 'AccessGrant' 
ORDER BY ordinal_position;

-- 2. Vérifier que les FK existent
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name IN ('AccessGrant', 'Invitation');

-- 3. Vérifier que l'enum existe
SELECT * FROM pg_type WHERE typname = 'AccessGrantStatus';

-- 4. Vérifier les indices
SELECT indexname FROM pg_indexes WHERE tablename = 'AccessGrant';

-- 5. Vérifier les contraintes UNIQUE
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'AccessGrant' AND constraint_type = 'UNIQUE';
```

---

## 📚 Documentation connexe

- **Audit complet** : `AUDIT_INVITATION_FLOW_COMPLET.md`
- **Migration SQL** : `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql`
- **Code modifié** :
  - `src/app/api/invitations/accept/route.ts`
  - `src/app/api/dossiers/quick-invite/route.ts`
  - `prisma/schema.prisma`

---

## ✅ Prochaines étapes

1. **Aujourd'hui** : Appliquer la migration SQL (Phase 2)
2. **Demain** : Exécuter les tests (Phase 3)
3. **Jour 3** : Vérification finale (Phase 4) et déploiement

**Pas de déploiement en production tant que la migration SQL n'est pas appliquée.**
