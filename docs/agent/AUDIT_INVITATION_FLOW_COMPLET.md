# 🔍 AUDIT COMPLET : PARCOURS D'INVITATION CLIENT

**Date** : 2026-01-15  
**Statut** : ⚠️ **BLOCAGES CRITIQUES IDENTIFIÉS** (ne pas déployer en production)  
**Verdict** : Le flux fonctionne côté code **MAIS** des incohérences SQL + sécurité exigent des corrections avant tout go-live.

---

## 📋 Résumé exécutif

| Composant | État | Risque | Action |
|---|---|---|---|
| **Route création invitation** (`/api/dossiers/[id]/invite`) | ✅ Bon | Faible | Vérifier email client OK |
| **Route acceptation** (`/api/invitations/accept`) | ✅ Code bon | **CRITIQUE** | Migration SQL incomplète |
| **Page invitation client** | ✅ Bon | Faible | Pas d'issue identifiée |
| **Route "quick-invite"** | 🟡 Provisioning | **MOYEN** | Auto-création tenant/user/dossier = risque |
| **Schema Prisma** | ✅ Relations OK | Faible | Corrections P1-5 appliquées ✓ |
| **Migration SQL** | 🔴 **INCOMPLÈTE** | **CRITIQUE** | FK manquantes, `dossierId` absent dans `AccessGrant` |

---

## 🔐 ANALYSE DÉTAILLÉE PAR COMPOSANT

### **1. ROUTE DE CRÉATION D'INVITATION** ✅ SÉCURE
**Chemin** : `src/app/api/dossiers/[id]/invite/route.ts`

#### ✅ Points forts
- ✅ Authentification Clerk obligatoire
- ✅ Normalisation + validation email (Zod implicite via `isValidEmail`)
- ✅ Vérification de propriété du dossier (lawyerId OU responsableId)
- ✅ Évitement des doublons (invitation PENDING non-expirée déjà présente)
- ✅ Génération token sécurisée : 32 octets aléatoires + SHA-256
- ✅ Lien invitation envoyé via Resend (non-bloquant)
- ✅ Validation des délais d'expiration (1-30 jours, par défaut 7)

#### ⚠️ Points à vérifier en production
```typescript
// LIGNE 32: Vérification de propriété
const dossier = await prisma.dossier.findFirst({
  where: { id: dossierId, OR: [{ lawyerId: userId }, { responsableId: userId }] },
});
```
- **OK** : Accepte avocat principal (lawyerId) OU responsable du dossier
- **À vérifier** : Est-ce que `responsableId` existe partout dans le code ?

#### 📝 Recommandation
Pas de changement requis. Cette route est **sécure pour production**.

---

### **2. ROUTE D'ACCEPTATION** 🔴 **BLOCAGE CRITIQUE**
**Chemin** : `src/app/api/invitations/accept/route.ts`

#### ✅ Points forts (CODE)
```typescript
// LIGNE 20: Inclut le dossier pour vérifier le tenant
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { dossier: true },  // ← Excellent
});

// LIGNE 29-30: Vérifie email Clerk vs email invitation
const userEmail = user.emailAddresses[0]?.emailAddress;
if (userEmail !== invitation.email) {
  return new NextResponse('This invitation was not sent to your email address', { status: 403 });
}

// LIGNE 37-50: Vérification tenant + transaction ATOMIQUE
await prisma.$transaction([
  prisma.accessGrant.create({ ... }),
  prisma.invitation.update({ ... }),
]);
```

#### 🔴 PROBLÈME 1 : Migration SQL incomplète
**Fichier** : `prisma/migrations/20261116120000_add_invitation_access_grant_and_consent_fields/migration.sql`

```sql
-- ❌ MANQUANT : Pas de contrainte de clé étrangère vers User
CREATE TABLE IF NOT EXISTS "AccessGrant" (
  "id"           TEXT NOT NULL,
  "invitationId" TEXT NOT NULL,
  "clientUserId" TEXT NOT NULL,  -- ← Pas de FK vers User
  "dossierId"    TEXT,           -- ← FAUX: absent de la migration !
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  ...
);

-- ❌ MANQUANT : Pas de FK vers Dossier
-- ❌ MANQUANT : updatedAt absent de la migration
-- ❌ MANQUANT : status absent de la migration
```

**Comparaison avec schema.prisma actualisé (après P1-5)** :
```prisma
model AccessGrant {
  id             String   @id @default(cuid())
  invitation     Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  invitationId   String   @unique
  clientUser     User       @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  clientUserId   String
  dossier        Dossier    @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId      String     -- ← REQUIS mais absent de la migration
  expiresAt      DateTime
  revokedAt      DateTime?
  status         AccessGrantStatus @default(ACTIVE)  -- ← Absent de la migration
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt  -- ← Absent de la migration
  ...
}
```

#### 🔴 PROBLÈME 2 : Email Clerk peut ne pas être vérifié
```typescript
const userEmail = user.emailAddresses[0]?.emailAddress;
```
- **Issue** : `emailAddresses[0]` n'est PAS nécessairement l'email vérifié
- **Risque** : Un attaquant crée un compte Clerk avec `attacker@example.com`, mais ne le vérifie pas. L'invitation est envoyée à `victim@example.com`. L'attaquant ne peut pas l'accepter. **Mais**, si Clerk permet de changer l'email sans vérification d'abord, il y a une faille.

#### ✅ Atomicité transaction
La transaction Prisma garantit que soit (AccessGrant + Invitation updated) soit rien. **C'est bon.**

#### 📝 Blocages à résoudre AVANT production

| Problème | Priorité | Correction |
|---|---|---|
| Migration SQL incomplète (`dossierId`, `updatedAt`, `status`, FK) | 🔴 P0 | Créer une nouvelle migration Prisma qui ajoute les colonnes manquantes et les FK |
| Email Clerk non-vérifié | 🟡 P1 | Vérifier que `user.emailAddresses[0].verification.status === 'verified'` |
| Vérification de tenant insuffisante | 🟡 P1 | Voir "PROBLÈME 3" ci-dessous |

#### 🔴 PROBLÈME 3 : Vérification de tenant incomplète
```typescript
// LIGNE 44: Cherche si l'utilisateur est dans le tenant du dossier
const userInTenant = await prisma.user.findFirst({
  where: {
    id: userId,
    tenantId: invitation.dossier.tenantId,
  },
});
if (!userInTenant) {
  return new NextResponse('You are not authorized to access this dossier', { status: 403 });
}
```

**Problème** : Cette vérification s'assure que le client acceptant l'invitation est bien dans le même tenant. Mais cela signifie que :
1. Un client doit avoir un `tenantId` pour accepter une invitation
2. Si le client n'est pas pré-créé dans le tenant, il sera rejeté

**Est-ce intentionnel ?** Oui, probablement. Mais il faut vérifier que les clients sont pré-crées lors de leur première invitation, ou qu'on crée un profil utilisateur automatiquement à partir de Clerk.

---

### **3. PAGE D'INVITATION CLIENT** ✅ SÉCURE
**Chemin** : `src/app/[locale]/invitation/[token]/page.tsx`

#### ✅ Points forts
- ✅ Token extraite de l'URL (paramètre `[token]`)
- ✅ Vérification d'authentification Clerk (`isLoaded`, `userId`)
- ✅ Appellle `/api/invitations/accept` avec le token
- ✅ Redirection vers le dossier accepté (`/fr/espace-client/{dossierId}`)
- ✅ Affichage d'erreur lisible en cas de rejet

#### ⚠️ Points mineurs
```typescript
// LIGNE 20
if (!isLoaded || !userId || !token) return;
```
- **Question** : Que se passe-t-il si `token` est undefined ? La fonction `acceptInvitation` n'est pas appelée. L'utilisateur reste sur la page "Vérification en cours...". C'est OK (UX acceptable), mais on pourrait afficher une erreur.

#### 📝 Recommandation
Pas de changement requis. Cette page est **sécure pour production**.

---

### **4. ROUTE "QUICK INVITE"** 🟡 PROVISIONING RISQUÉ
**Chemin** : `src/app/api/dossiers/quick-invite/route.ts`

#### ⚠️ Comportement dangereux

Cette route crée automatiquement :
1. ✅ Un User Clerk → ✅ Obligatoire
2. 🔴 Un User en DB (auto-provisioning)
3. 🔴 Un Tenant (si aucun n'existe)
4. 🔴 Un Client
5. 🔴 Un Dossier
6. 🔴 Une Invitation

**Flux** :
```typescript
// LIGNE 25: Si l'utilisateur n'existe pas en DB, le CRÉER
if (!dbUser) {
  if (!ALLOW_AUTO_PROVISION) return 403;  // ← Guard, mais...
  
  let tenant = await prisma.tenant.findFirst();  // ← Prend le premier tenant !
  if (!tenant) {
    tenant = await prisma.tenant.create({ ... });  // ← Crée un nouveau tenant
  }
  
  dbUser = await prisma.user.create({...});
}
```

#### 🔴 PROBLÈMES CRITIQUES

| Problème | Risque | Exemple |
|---|---|---|
| **Guard `ALLOW_AUTO_PROVISION` trop simple** | Moyen | En prod, `NODE_ENV !== 'production'` mais `ALLOW_QUICK_PROVISION === 'true'` = provisioning activé |
| **Tenant pris "au hasard" (findFirst)** | 🔴 CRITIQUE | 2 requêtes simultanées créent 2 tenants différents ; les avocats se retrouvent isolés |
| **Pas de rôle AVOCAT attribué au nouvel User** | Moyen | Crée avec `role: 'AVOCAT'`, mais pas de validation contre schema.prisma |
| **Email Clerk `emailAddresses[0]` sans vérification** | Moyen | Comme le problème #2 |
| **Client créé avec `nom/prenom = "En attente"`** | Faible | OK, mais pas de vérification email du client |
| **Dossier créé avec `statut: 'en_attente_client'`** | OK | Logique métier acceptable |

#### 📝 Verdict
La route `quick-invite` est un **raccourci de développement** qui ne devrait **PAS être exposée en production**. 

**À faire** :
- [ ] Désactiver `ALLOW_QUICK_PROVISION` en production
- [ ] Supprimer la route (ou la verrouiller avec une clé API secrète)
- [ ] Ou bien, refactoriser pour utiliser une logique de provisioning pré-authentifiée

---

### **5. SCHEMA PRISMA** ✅ MAINTENANT CORRECT (P1-5)
**Fichier** : `prisma/schema.prisma`

#### ✅ Après les modifications P1-5

**User** (lignes ~700-750) :
```prisma
model User {
  // ... champs existants
  
  // ✅ P1-5: Relations for Invitations
  invitationsCreated Invitation[] @relation("InvitationsCreated")
  clientAccess       AccessGrant[] @relation("ClientAccess")
  
  @@index([role])
}
```

**Invitation** (lignes ~1250-1280) :
```prisma
model Invitation {
  id        String   @id @default(cuid())
  email     String
  
  // ✅ Relations
  dossier        Dossier  @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId      String
  
  lawyer         User     @relation("InvitationsCreated", fields: [lawyerId], references: [id], onDelete: Restrict)
  lawyerId       String
  
  accessGrants   AccessGrant[]
  
  // Data
  tokenHash      String   @unique
  expiresAt      DateTime
  status         InvitationStatus @default(PENDING)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([dossierId, email, status])
  @@index([lawyerId])
  @@index([expiresAt])
}
```

**AccessGrant** (lignes ~1280-1310) :
```prisma
model AccessGrant {
  id        String   @id @default(cuid())
  
  // ✅ Relations
  invitation     Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  invitationId   String   @unique
  
  clientUser     User       @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  clientUserId   String
  
  dossier        Dossier    @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId      String
  
  // Data
  expiresAt      DateTime
  revokedAt      DateTime?
  status         AccessGrantStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([invitationId, clientUserId])
  @@index([dossierId])
  @@index([clientUserId])
  @@index([expiresAt])
}
```

#### ✅ État
Le schema Prisma est **maintenant cohérent** après P1-5. Mais la migration SQL est toujours **incomplète**.

---

## 🚨 CARTOGRAPHIE DU PARCOURS D'INVITATION

### Scénario : Un avocat invite un client

```
┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣  AVOCAT crée une invitation                                  │
│    POST /api/dossiers/[id]/invite                              │
│    { email: "client@example.com", expiresInDays: 7 }           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ✅ Validations passent :
        - Authentification Clerk (avocat)
        - Email normalisé et validé
        - Propriété du dossier vérifié
        - Pas de doublon invitation PENDING
                              ↓
        ✅ Création en DB :
        - Invitation(email, dossierId, lawyerId, tokenHash, expiresAt)
        - Token plaintext généré
        - Envoi email via Resend (non-bloquant)
                              ↓
        ✅ Réponse : inviteLink + expiresAt
            POST /api/dossiers/[id]/invite → HTTP 200
            {
              "inviteLink": "https://app.memolib.fr/fr/invitation/eyJ...",
              "expiresAt": "2026-01-22T10:30:00Z"
            }

┌─────────────────────────────────────────────────────────────────┐
│ 2️⃣  CLIENT clique sur le lien invitation                        │
│    GET /fr/invitation/[token]                                   │
│    → Page "useClient" qui charge automatiquement                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ✅ Vérifications côté client :
        - Authentification Clerk (client doit être connecté)
        - Token extrait de l'URL
        - Appel /api/invitations/accept avec token
                              ↓
        🟡 Route /api/invitations/accept :
        1. Hasher le token (SHA-256)
        2. Chercher Invitation par tokenHash (include Dossier)
        3. Vérifier status = PENDING
        4. Vérifier expiresAt > now()
        5. ⚠️ Vérifier email du client = email invitation
           (PROBLÈME: emailAddresses[0] peut ne pas être vérifié)
        6. ⚠️ Vérifier client dans tenant du dossier
        7. ✅ Transaction atomique :
           - Créer AccessGrant
           - Mettre à jour Invitation.status = ACCEPTED
                              ↓
        🔴 PROBLÉME MIGRATION SQL :
        - Colonne "dossierId" manquante dans AccessGrant
        - Colonne "status" manquante dans AccessGrant
        - Colonne "updatedAt" manquante dans AccessGrant
        - FK vers User / Dossier / Invitation manquantes
        → La création d'AccessGrant va **ÉCHOUER**
                              ↓
        ❌ Résultat : HTTP 500 ou UNIQUE constraint error

┌─────────────────────────────────────────────────────────────────┐
│ 3️⃣  CLIENT accède au dossier (SI l'invitation a marché)        │
│    GET /fr/espace-client/[dossierId]                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ✅ Le client a maintenant AccessGrant.expiresAt
        → L'accès est valide jusqu'à expiration
        → Redirection réussie avec message "Succès"
```

---

## 🔧 PLAN DE CORRECTION PRIORITARISÉ

### **P0 — BLOCAGE PRODUCTION** 🔴 (faire MAINTENANT)

#### ✅ P0.1 : Fixer la migration SQL (AccessGrant)
**Fichier** : Créer `prisma/migrations/YYYYMMDD_fix_access_grant_schema/migration.sql`

```sql
-- Ajouter les colonnes manquantes à AccessGrant
ALTER TABLE "AccessGrant" ADD COLUMN "dossierId"  TEXT NOT NULL;
ALTER TABLE "AccessGrant" ADD COLUMN "status"     TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AccessGrant" ADD COLUMN "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ajouter les FK manquantes
ALTER TABLE "AccessGrant" 
  ADD CONSTRAINT "AccessGrant_dossierId_fkey" 
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE;

ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_invitationId_fkey"
  FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE;

ALTER TABLE "AccessGrant"
  ADD CONSTRAINT "AccessGrant_clientUserId_fkey"
  FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Ajouter les FK manquantes à Invitation
ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_dossierId_fkey"
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE;

ALTER TABLE "Invitation"
  ADD CONSTRAINT "Invitation_lawyerId_fkey"
  FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT;

-- Enum AccessGrantStatus
DO $$ BEGIN
  CREATE TYPE "AccessGrantStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Recréer colonne status avec bon type
ALTER TABLE "AccessGrant" ALTER COLUMN "status" TYPE "AccessGrantStatus" USING "status"::"AccessGrantStatus";
```

**Vérification après** :
```bash
prisma migrate deploy  # Appliquer la migration
prisma db push          # Ou utiliser db push si nécessaire
prisma studio          # Vérifier les FK dans l'UI Prisma
```

---

### **P1 — SÉCURITÉ** 🟡 (faire avant production)

#### P1.1 : Vérifier email Clerk est vérifié
**Fichier** : `src/app/api/invitations/accept/route.ts`

```typescript
// Remplacer LIGNE 29
const userEmail = user.emailAddresses[0]?.emailAddress;
if (userEmail !== invitation.email) {
  return new NextResponse('This invitation was not sent to your email address', { status: 403 });
}

// PAR :
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

#### P1.2 : Désactiver ALLOW_QUICK_PROVISION en prod
**Fichier** : `src/app/api/dossiers/quick-invite/route.ts`

```typescript
// LIGNE 7: Rendre plus explicite
const ALLOW_AUTO_PROVISION = process.env.ALLOW_QUICK_PROVISION === 'true';
// Ajouter un warning en log
if (ALLOW_AUTO_PROVISION && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ QUICK_PROVISION enabled in production. This is a security risk.');
}
```

Ou mieux : supprimer la route entièrement en production.

---

### **P2 — COHÉRENCE** 🟢 (faire avant le premier déploiement)

#### P2.1 : Ajouter relation Dossier → Invitation / AccessGrant
**Fichier** : `prisma/schema.prisma` (modèle Dossier)

```prisma
model Dossier {
  // ... existing fields ...
  
  // ✅ Relations
  invitations Invitation[]
  accessGrants AccessGrant[]
  
  // ... rest of model ...
}
```

#### P2.2 : Ajouter logs d'audit
**Fichier** : `src/app/api/invitations/accept/route.ts`

```typescript
// Après succès de la transaction
await prisma.auditLog.create({
  data: {
    tenantId: invitation.dossier.tenantId,
    userId,
    userEmail: verifiedEmail.emailAddress,
    action: 'INVITATION_ACCEPTED',
    entityType: 'Invitation',
    entityId: invitation.id,
    newValue: JSON.stringify({ dossierId: invitation.dossierId }),
    timestamp: new Date(),
  },
});
```

---

## ✅ CHECKLIST PRÉ-PRODUCTION

- [ ] **P0.1** : Migration SQL complète appliquée (`dossierId`, `status`, `updatedAt`, FK)
- [ ] **P1.1** : Vérification email Clerk vérifié dans `/api/invitations/accept`
- [ ] **P1.2** : `ALLOW_QUICK_PROVISION` désactivé en production
- [ ] **P2.1** : Relations Dossier → Invitation / AccessGrant ajoutées au schema
- [ ] **P2.2** : Logs d'audit implémentés pour les acceptations d'invitation
- [ ] Tests d'acceptation d'invitation (happy path + erreurs)
- [ ] Test concurrence : 2 clients acceptent la même invitation simultanément
- [ ] Test expiration : accepter une invitation après son expiration
- [ ] Test email erroné : accepter avec un email différent de celui de l'invitation
- [ ] Test tenant mismatch : vérifier qu'un client hors-tenant ne peut pas accepter

---

## 📊 RÉSUMÉ FINAL

| Aspect | État | Risque | Action |
|---|---|---|---|
| **Code métier** | ✅ Bon | Faible | Aucune |
| **Sécurité authentification** | ✅ OK | Moyen | Vérifier email Clerk vérifié |
| **Atomicité transaction** | ✅ OK | Faible | Aucune |
| **Schema Prisma** | ✅ Corrigé (P1-5) | Faible | Aucune |
| **Migration SQL** | 🔴 Incomplète | 🔴 CRITIQUE | Créer nouvelle migration |
| **Route quick-invite** | 🟡 Risquée | Moyen | Désactiver en prod |
| **Dossier → relations** | 🔴 Manquant | Faible | Ajouter au schema |

---

## 🎯 RECOMMANDATION FINALE

**Ne pas déployer en production tant que :**

1. ✅ P0.1 (migration SQL) n'est pas appliquée
2. ✅ P1.1 (email vérified) n'est pas implémenté
3. ✅ Les tests de concurrence ne passent pas

**Timeline suggéré** :
- **Jour 1 (aujourd'hui)** : Appliquer P0.1 + P1.1 + P1.2
- **Jour 2** : Tester, puis merger
- **Jour 3+** : Déployer en staging, puis production

**Verdict** : Le code **fonctionne correctement logiquement**, mais l'infrastructure SQL **manque de colonnes critiques**. C'est un bug de migration, pas de logique métier.
