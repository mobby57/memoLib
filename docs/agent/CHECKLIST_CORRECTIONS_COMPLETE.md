# ✅ CHECKLIST COMPLÈTE - Corrections P0, P1, P2

**À compléter avant tout déploiement**

---

## Phase 1 : Vérifications de code ✅

### Code changes appliqués
- [ ] `src/app/api/invitations/accept/route.ts` contient la vérification email vérifié
  ```typescript
  const verifiedEmail = user.emailAddresses.find(
    (email) => email.verification?.status === 'verified' && email.emailAddress === invitation.email
  );
  ```

- [ ] `src/app/api/dossiers/quick-invite/route.ts` contient le warning en prod
  ```typescript
  if (ALLOW_AUTO_PROVISION && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  SECURITY WARNING...');
  }
  ```

- [ ] `prisma/schema.prisma` modèle User contient :
  ```prisma
  invitationsCreated Invitation[] @relation("InvitationsCreated")
  clientAccess       AccessGrant[] @relation("ClientAccess")
  ```

- [ ] `prisma/schema.prisma` modèle Dossier contient :
  ```prisma
  invitations        Invitation[]
  accessGrants       AccessGrant[]
  ```

---

## Phase 2 : Migration SQL 🚨

### Préparation
- [ ] Fichier `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql` existe dans le répertoire racine
- [ ] Avez-vous lu le contenu de la migration ?
- [ ] Avez-vous sauvegardé votre base de données ? (backup)

### Application

#### Option A : Script automatisé
- [ ] Sur Windows : exécuté `.\apply_migration_fix_access_grant.ps1`
  ```powershell
  .\apply_migration_fix_access_grant.ps1
  ```
- [ ] Sur macOS/Linux : exécuté `bash apply_migration_fix_access_grant.sh`
  ```bash
  bash apply_migration_fix_access_grant.sh
  ```
- [ ] Le script s'est terminé sans erreur ✅

#### Option B : Manuel via Prisma CLI
- [ ] Créé le dossier : `mkdir -p prisma/migrations/20261117_fix_access_grant_schema`
- [ ] Copié le fichier : `cp MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql prisma/migrations/20261117_fix_access_grant_schema/migration.sql`
- [ ] Exécuté : `npx prisma migrate deploy`
- [ ] Généré Prisma : `npx prisma generate`

#### Option C : SQL direct (Neon)
- [ ] Ouvert Neon SQL Editor (dashboard.neon.tech)
- [ ] Copié-collé le contenu de `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql`
- [ ] Exécuté la migration
- [ ] Vérification réussie

---

## Phase 3 : Vérifications post-migration 🔍

### Colonnes AccessGrant
Exécutez cette requête SQL et vérifiez le résultat :
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'AccessGrant' 
ORDER BY ordinal_position;
```

Résultat attendu :
- [ ] `id` (text, NOT NULL)
- [ ] `invitationId` (text, NOT NULL)
- [ ] `clientUserId` (text, NOT NULL)
- [ ] `dossierId` (TEXT, NOT NULL) ← **NOUVELLE**
- [ ] `status` (USER-DEFINED, NOT NULL) ← **NOUVELLE**
- [ ] `updatedAt` (timestamp, NOT NULL) ← **NOUVELLE**
- [ ] `expiresAt` (timestamp, NOT NULL)
- [ ] `revokedAt` (timestamp, YES)
- [ ] `createdAt` (timestamp, NOT NULL)

### Contraintes de clé étrangère
Vérifiez que les FK existent :
```sql
SELECT constraint_name, table_name 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('AccessGrant', 'Invitation')
ORDER BY table_name;
```

Résultat attendu :
- [ ] `AccessGrant_invitationId_fkey`
- [ ] `AccessGrant_clientUserId_fkey`
- [ ] `AccessGrant_dossierId_fkey`
- [ ] `Invitation_dossierId_fkey`
- [ ] `Invitation_lawyerId_fkey`

### Type enum
Vérifiez que l'enum existe :
```sql
SELECT typname FROM pg_type WHERE typname = 'AccessGrantStatus';
```
- [ ] Le type `AccessGrantStatus` existe

---

## Phase 4 : Vérifications Prisma 📦

### Génération
- [ ] `npx prisma generate` exécuté sans erreur
- [ ] Pas de warning "schema.prisma not matching database"

### TypeScript
- [ ] `npm run typecheck` ou `tsc --noEmit` passe sans erreur
- [ ] Aucune erreur de type sur les modèles Invitation/AccessGrant

### Build
- [ ] `npm run build` complète avec succès
- [ ] Pas d'erreur TypeScript lors du build
- [ ] Fichiers générés présents dans `.next/`

### Studio (optionnel)
- [ ] `npx prisma studio` s'ouvre
- [ ] Tables `Invitation` et `AccessGrant` visibles
- [ ] Colonnes correctes affichées

---

## Phase 5 : Vérifications d'environnement ⚙️

### Variables d'environnement
- [ ] `.env` ou `.env.local` **NE contient PAS** `ALLOW_QUICK_PROVISION=true`
- [ ] `.env.production` **NE contient JAMAIS** `ALLOW_QUICK_PROVISION=true`
- [ ] `DATABASE_URL` pointe vers la bonne base de données

### Configuration de sécurité
- [ ] Email Clerk JWT configuré correctement
- [ ] Resend API key présent (pour envoi email)
- [ ] Variables secrètes ne sont **PAS** commitées

---

## Phase 6 : Tests fonctionnels 🧪

### Test unitaire (si disponible)
```bash
npm test -- invitations
```
- [ ] Les tests passent

### Test manuel du parcours d'invitation

#### Étape 1 : Créer une invitation
```bash
curl -X POST http://localhost:3000/api/dossiers/[DOSSIER_ID]/invite \
  -H "Authorization: Bearer [CLERK_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","expiresInDays":7}'
```
- [ ] ✅ Réponse HTTP 200
- [ ] ✅ Contient `inviteLink` et `expiresAt`
- [ ] ✅ Invitation créée en DB

#### Étape 2 : Vérifier l'invitation en DB
```sql
SELECT id, email, status, tokenHash, expiresAt 
FROM "Invitation" 
WHERE email = 'client@example.com' 
ORDER BY createdAt DESC 
LIMIT 1;
```
- [ ] ✅ Invitation trouvée
- [ ] ✅ `status = PENDING`
- [ ] ✅ `tokenHash` présent

#### Étape 3 : Accepter l'invitation
```bash
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Authorization: Bearer [CLERK_TOKEN_CLIENT]" \
  -H "Content-Type: application/json" \
  -d '{"token":"[TOKEN_FROM_INVITE_LINK]"}'
```
- [ ] ✅ Réponse HTTP 200
- [ ] ✅ Contient `dossierId`
- [ ] ✅ Pas d'erreur de colonne manquante
- [ ] ✅ Pas d'erreur de FK violation

#### Étape 4 : Vérifier l'AccessGrant en DB
```sql
SELECT id, invitationId, clientUserId, dossierId, status, expiresAt 
FROM "AccessGrant" 
ORDER BY createdAt DESC 
LIMIT 1;
```
- [ ] ✅ AccessGrant créée
- [ ] ✅ `dossierId` présent et valide
- [ ] ✅ `status = ACTIVE`
- [ ] ✅ `updatedAt` présent

#### Étape 5 : Vérifier l'Invitation mise à jour
```sql
SELECT status FROM "Invitation" WHERE id = '[INVITATION_ID]';
```
- [ ] ✅ `status = ACCEPTED`

#### Étape 6 : Test avec email non-vérifié
- [ ] ✅ Créer un Clerk user avec email non-vérifié
- [ ] ✅ Essayer d'accepter l'invitation
- [ ] ✅ Doit retourner HTTP 403 avec message "verify the email address"

---

## Phase 7 : Vérifications de sécurité 🔒

### Configuration de production
- [ ] `NODE_ENV=production` en prod
- [ ] `ALLOW_QUICK_PROVISION` NOT SET ou `false` en prod
- [ ] Variables secrètes dans un vault (pas en `.env`)

### Logs de sécurité
Vérifiez les logs :
```bash
# Si ALLOW_QUICK_PROVISION=true en prod
grep "SECURITY WARNING" logs.txt
# ✅ Le warning doit apparaître
```

### Email Clerk vérifié
- [ ] Le code vérifie `email.verification?.status === 'verified'`
- [ ] Un email non-vérifié ne peut pas accepter d'invitation
- [ ] Testé et validé

---

## Phase 8 : Documentation 📚

### Fichiers de documentation
- [ ] Lire `MEMO_URGENT_CORRECTIONS.md`
- [ ] Lire `GUIDE_IMPLEMENTATION_CORRECTIONS.md`
- [ ] Lire `AUDIT_INVITATION_FLOW_COMPLET.md` (optionnel, pour détails)

### Documentation du projet
- [ ] Ajouter une note dans `README.md` sur les migrations appliquées
- [ ] Documenter l'email verification requirement dans la documentation du flux

---

## Phase 9 : Déploiement 🚀

### Avant staging
- [ ] Toutes les cases ci-dessus sont cochées ✅

### Staging
- [ ] Migration appliquée en staging
- [ ] Tests fonctionnels passent en staging
- [ ] Logs clean (aucun error ou warning inattendu)

### Production
- [ ] Migration appliquée en production
- [ ] `.env.production` configué correctement
- [ ] Healthcheck endpoint teste le parcours d'invitation
- [ ] Monitorage des erreurs en place

---

## 🎉 Statut final

Une fois toutes les cases cochées :

✅ **Code prêt**  
✅ **Migration appliquée**  
✅ **Tests passés**  
✅ **Sécurité vérifiée**  

**Statut** : 🟢 **PRÊT POUR LA PRODUCTION**

---

**Dernière vérification** : _____________________  
**Vérifié par** : _____________________  
**Date** : _____________________  
**Ticket/PR** : _____________________
