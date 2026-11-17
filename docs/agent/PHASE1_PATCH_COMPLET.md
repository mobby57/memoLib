# 🔧 PHASE 1 — PATCHES COMPLETS (P1-1 à P1-5)

**Date:** 2026-11-17  
**Statut:** Prêt pour implémentation

---

## 📋 INSTRUCTIONS PRÉLIMINAIRES

```bash
# 1. Créer une branche locale
git checkout -b feature/security-fix-invitations

# 2. Faire un backup complet avant modifications
git bundle create ../memolib-backup.bundle --all
# Vérifier:
ls -lah ../memolib-backup.bundle

# 3. Vérifier l'état avant
git status
```

---

## 🔴 P1-1: EMAIL VERIFICATION (CRITIQUE)

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Problème:** L'email utilisé n'est pas nécessairement l'email vérifié qui correspond à l'invitation.

**Code actuel (VULNÉRABLE):**
```typescript
// Ligne ~25
const userEmail = user.emailAddresses[0]?.emailAddress;
// ❌ Problème: Pas d'assurance que c'est l'email vérifié
// ❌ Problème: user.emailAddresses[0] peut être non-vérifiée
```

**Code corrigé:**
```typescript
// Remplacer la ligne ~25-30 par:
// Vérifier que l'utilisateur a un email primaire ET vérifié
const primaryEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
if (!primaryEmail || !primaryEmail.verification?.status !== 'verified') {
  return NextResponse.json(
    { error: 'Email address not verified. Please verify your email before accepting invitation.' },
    { status: 400 }
  );
}

const userEmail = primaryEmail.emailAddress;
// ✅ Maintenant on est certain que l'email est vérifié

// Ajouter une vérification stricte aussi:
if (userEmail !== invitation.invitedEmail) {
  return NextResponse.json(
    { error: 'Email mismatch. Invitation was sent to a different email address.' },
    { status: 403 }
  );
}
// ✅ L'email de l'utilisateur doit correspondre exactement à invitedEmail
```

**Test à faire:**
```bash
# Test 1: Email non-vérifié
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"test123"}' \
  # Doit retourner 400 "not verified"

# Test 2: Email qui ne correspond pas
# Créer invitation pour alice@example.com
# Accepter avec bob@example.com (connecté)
# Doit retourner 403 "Email mismatch"
```

---

## 🔴 P1-2: RACE CONDITION (CRITIQUE)

**Fichier:** `src/app/api/dossiers/[id]/invite/route.ts`

**Problème:** Deux requêtes concurrentes peuvent créer deux invitations identiques.

**Code actuel (VULNÉRABLE):**
```typescript
// Ligne ~30-50
// Vérifier si invitation existe
const existing = await prisma.invitation.findFirst({
  where: {
    dossierId: id,
    invitedEmail: invitedEmail,
    status: 'PENDING'
  }
});

if (existing) {
  return NextResponse.json({ invitation: existing });
}

// ❌ RACE CONDITION ICI: Entre findFirst et create, autre requête peut créer

// Créer l'invitation
const invitation = await prisma.invitation.create({
  data: {
    dossierId: id,
    invitedEmail: invitedEmail,
    lawyerId: userId,
    token: generateToken(),
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
});
```

**Code corrigé:**
```typescript
// Remplacer TOUT le bloc par UNE transaction atomique:

const invitation = await prisma.$transaction(async (tx) => {
  // Vérifier si invitation existe (avec lock)
  const existing = await tx.invitation.findFirst({
    where: {
      dossierId: id,
      invitedEmail: invitedEmail,
      status: 'PENDING'
    }
  });

  if (existing) {
    // ✅ Toujours l'existante, même si concurrent essaye créer
    return existing;
  }

  // ✅ Créer DANS la même transaction (atomic)
  return await tx.invitation.create({
    data: {
      dossierId: id,
      invitedEmail: invitedEmail,
      lawyerId: userId,
      token: generateToken(),
      tokenHash: hashToken(token), // ← Optionnel mais mieux
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}, {
  isolationLevel: 'Serializable', // ← Force isolation stricte
  timeout: 5000,
});

return NextResponse.json({ invitation });
```

**Test à faire:**
```bash
# Test 1: 100 requêtes concurrentes, même email
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/dossiers/[id]/invite \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com"}' &
done
wait

# Vérifier en base: SELECT COUNT(*) FROM Invitation WHERE invitedEmail='alice@example.com'
# Doit être 1 (pas 100)

# Test 2: Load test avec Apache Bench
ab -n 100 -c 10 -p payload.json http://localhost:3000/api/dossiers/[id]/invite
# Doit avoir 0 duplicates
```

---

## 🔴 P1-3: TENANT VERIFICATION (CRITIQUE)

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Problème:** Pas de vérification que le tenant de l'utilisateur correspond au tenant du dossier.

**Code actuel (VULNÉRABLE):**
```typescript
// Ligne ~40-55
// Chercher l'invitation
const invitation = await prisma.invitation.findUnique({
  where: { token: tokenHash },
  include: { dossier: true } // ← Pas utilisé après
});

if (!invitation) {
  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}

// ❌ MISSING: Vérifier que le dossier appartient au tenant de l'utilisateur
// ❌ Un utilisateur du tenant A pourrait accepter une invitation du tenant B
```

**Code corrigé:**
```typescript
// Remplacer le bloc par:

const invitation = await prisma.invitation.findUnique({
  where: { token: tokenHash },
  include: {
    dossier: {
      include: { cabinet: true } // ← Inclure pour vérifier tenant
    }
  }
});

if (!invitation) {
  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}

// ✅ NOUVEAU: Vérifier que le cabinet (tenant) est correct
const userTenant = await prisma.cabinet.findFirst({
  where: {
    id: invitation.dossier.cabinetId, // Ou ton tenant ID field
    users: { some: { id: userId } }   // Utilisateur doit être member
  }
});

if (!userTenant) {
  return NextResponse.json(
    { error: 'You are not authorized to access this dossier.' },
    { status: 403 }
  );
}

// ✅ Maintenant on est certain que:
// - L'invitation existe
// - Le dossier existe
// - L'utilisateur a accès au tenant du dossier
```

**Test à faire:**
```bash
# Test 1: Créer deux cabinets (tenants) différents
# Cabinet A: alice@a.com
# Cabinet B: bob@b.com

# Créer dossier dans Cabinet A
# Générer invitation pour bob@b.com (email du Cabinet B)
# Bob accepte l'invitation

# Doit retourner 403 "not authorized"
```

---

## 🟠 P1-4: JSON VALIDATION (HAUTE)

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Problème:** `request.json()` peut échouer sans try-catch, causant erreur 500 au lieu de 400.

**Code actuel (VULNÉRABLE):**
```typescript
// Ligne ~10-15
const { token } = await request.json();
// ❌ Pas de try-catch
// Si JSON invalide → 500 error (expose infra details)
```

**Code corrigé:**
```typescript
// Ajouter try-catch:
let token: string;
try {
  const body = await request.json();
  token = body.token;
  
  // ✅ Validation Zod (si disponible)
  const schema = z.object({
    token: z.string().min(32).max(255),
  });
  
  const validated = schema.parse(body);
  token = validated.token;
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Invalid request format', details: error.errors },
      { status: 400 }
    );
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }
  throw error; // ← Autres erreurs non-JSON
}
```

**Test à faire:**
```bash
# Test 1: JSON invalide
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{invalid json}' \
  # Doit retourner 400 (pas 500)

# Test 2: Token manquant
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{"other":"field"}' \
  # Doit retourner 400 "token required"

# Test 3: Token trop court
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"short"}' \
  # Doit retourner 400 "token too short"
```

---

## 🟠 P1-5: PRISMA RELATIONS (HAUTE)

**Fichier:** `prisma/schema.prisma`

**Problème:** Les modèles `Invitation` et `AccessGrant` ont des foreign keys mais pas de relations Prisma.

**Code actuel (VULNÉRABLE):**
```prisma
// Ligne ~150-170
model Invitation {
  id        String   @id @default(cuid())
  dossierId String   // ❌ FK field sans @relation
  lawyerId  String   // ❌ FK field sans @relation
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([dossierId])
  @@index([lawyerId])
}

model AccessGrant {
  id              String   @id @default(cuid())
  invitationId    String   // ❌ FK field sans @relation
  clientUserId    String   // ❌ FK field sans @relation
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([invitationId])
  @@index([clientUserId])
}

// ❌ Problèmes:
// - Prisma ne peut pas faire include/select sur dossier/lawyer
// - Orphaned data possible (supprimer dossier, invitation reste)
// - Impossible de cascader les délétions
```

**Code corrigé:**
```prisma
// Remplacer ENTIRE Invitation model:
model Invitation {
  id        String   @id @default(cuid())
  
  // Relations
  dossier   Dossier  @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId String
  
  lawyer    User     @relation("InvitationsCreated", fields: [lawyerId], references: [id], onDelete: Restrict)
  lawyerId  String
  
  // Accessors created from this invitation
  accessGrants AccessGrant[]
  
  // Data
  invitedEmail  String
  token         String  @unique
  tokenHash     String  @unique // SHA-256 hash
  status        String  @default("PENDING") // PENDING, ACCEPTED, EXPIRED
  expiresAt     DateTime
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([dossierId, invitedEmail, status])
  @@index([lawyerId])
  @@index([expiresAt])
}

// Remplacer ENTIRE AccessGrant model:
model AccessGrant {
  id        String   @id @default(cuid())
  
  // Relations
  invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  invitationId String
  
  dossier   Dossier  @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  dossierId String
  
  clientUser User    @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  clientUserId String
  
  // Data
  status    String  @default("ACTIVE") // ACTIVE, REVOKED, EXPIRED
  grantedBy String  // User ID who gave access
  expiresAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([invitationId, clientUserId])
  @@index([dossierId])
  @@index([clientUserId])
  @@index([expiresAt])
}

// Update User model to add relations:
model User {
  // ... existing fields ...
  
  // Add these relations (if missing):
  invitationsCreated Invitation[] @relation("InvitationsCreated")
  clientAccess       AccessGrant[] @relation("ClientAccess")
}

// Update Dossier model to add relation (if missing):
model Dossier {
  // ... existing fields ...
  
  // Add this relation (if missing):
  invitations   Invitation[]
  accessGrants  AccessGrant[]
}
```

**Migration SQL:**
```bash
# Créer la migration
npx prisma migrate dev --name fix_invitation_relations
# Vérifie la migration créée:
cat prisma/migrations/[timestamp]_fix_invitation_relations/migration.sql
# S'il y a des WARNING sur données orphanées, les afficher d'abord
```

**Contenu migration (approximatif):**
```sql
-- CreateIndex (if not exists)
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE UNIQUE INDEX "Invitation_dossierId_invitedEmail_status_key" 
  ON "Invitation"("dossierId", "invitedEmail", "status");

-- AddForeignKey (if not exists)
ALTER TABLE "Invitation" 
ADD CONSTRAINT "Invitation_dossierId_fkey" 
FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invitation" 
ADD CONSTRAINT "Invitation_lawyerId_fkey" 
FOREIGN KEY ("lawyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccessGrant" 
ADD CONSTRAINT "AccessGrant_invitationId_fkey" 
FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccessGrant" 
ADD CONSTRAINT "AccessGrant_dossierId_fkey" 
FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccessGrant" 
ADD CONSTRAINT "AccessGrant_clientUserId_fkey" 
FOREIGN KEY ("clientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Test à faire:**
```bash
# Test 1: Prisma relations work
npx ts-node -e "
  import { prisma } from '@/lib/prisma';
  const inv = await prisma.invitation.findFirst({
    include: { dossier: true, lawyer: true, accessGrants: true }
  });
  console.log('✅ Invitation with relations:', inv);
"

# Test 2: Cascade delete works
# Créer dossier → invitation → accessGrant
# Supprimer dossier
# Vérifier invitation et accessGrant aussi supprimés

# Test 3: Unique constraint
# Créer deux invitations identiques
# Doit retourner error (unique violation)
```

---

## ✅ CHECKLIST IMPLÉMENTATION

```
PRE-IMPLEMENTATION
├─ [ ] Créer branche: git checkout -b feature/security-fix-invitations
├─ [ ] Backup: git bundle create ../memolib-backup.bundle --all
├─ [ ] Vérifier branche: git status

P1-1: EMAIL VERIFICATION
├─ [ ] Éditer src/app/api/invitations/accept/route.ts (lignes 25-35)
├─ [ ] Ajouter vérification email vérifié
├─ [ ] Ajouter check email match
├─ [ ] Tester avec curl (non-vérified + mismatch)

P1-2: RACE CONDITION
├─ [ ] Éditer src/app/api/dossiers/[id]/invite/route.ts (lignes 30-50)
├─ [ ] Remplacer par transaction atomique
├─ [ ] Ajouter isolationLevel: 'Serializable'
├─ [ ] Tester avec 100 requêtes concurrentes

P1-3: TENANT VERIFICATION
├─ [ ] Éditer src/app/api/invitations/accept/route.ts (lignes 40-55)
├─ [ ] Ajouter include: { dossier: { include: { cabinet: true } } }
├─ [ ] Ajouter vérification tenant
├─ [ ] Tester cross-tenant access (doit retourner 403)

P1-4: JSON VALIDATION
├─ [ ] Éditer src/app/api/invitations/accept/route.ts (lignes 10-15)
├─ [ ] Ajouter try-catch sur request.json()
├─ [ ] Ajouter Zod validation (si disponible)
├─ [ ] Tester avec JSON invalide (doit retourner 400)

P1-5: PRISMA RELATIONS
├─ [ ] Éditer prisma/schema.prisma
├─ [ ] Ajouter @relation sur Invitation model
├─ [ ] Ajouter @relation sur AccessGrant model
├─ [ ] Ajouter relations à User et Dossier
├─ [ ] Exécuter: npx prisma migrate dev --name fix_invitation_relations
├─ [ ] Vérifier migration.sql généré
├─ [ ] Tester relations en TypeScript

TESTING
├─ [ ] npm run test -- invitations (si existe)
├─ [ ] npm run build (vérifier no errors)
├─ [ ] Manual E2E test: Create → Accept → Access flow
├─ [ ] Load test: 100 concurrent requests

GIT
├─ [ ] git add -A
├─ [ ] git commit -m "fix: security audit P1 fixes (invitations)"
├─ [ ] git log --oneline -5 (vérifier commit)

BEFORE PUSH
├─ [ ] Reread the 5 patches
├─ [ ] Run full test suite
├─ [ ] Code review by security lead
├─ [ ] Approval from product owner
```

---

## 📊 TEMPS ESTIMÉ PAR P1

| Fix | Complexité | Temps | Notes |
|-----|-----------|-------|-------|
| P1-1 | 🟢 Simple | 30 min | Ajouter email check |
| P1-2 | 🟡 Moyen | 1-2h | Transaction atomique + tests concurrence |
| P1-3 | 🟡 Moyen | 1h | Ajouter tenant check |
| P1-4 | 🟢 Simple | 30 min | Try-catch + Zod |
| P1-5 | 🟠 Complexe | 2-3h | Migration Prisma + tests |
| **TOTAL** | **🟠** | **5-7h dev** | **+ 2-3h testing + 1h review** |

---

## 🚀 LANCER MAINTENANT

**1. Préparer l'environnement:**
```bash
cd C:\Users\moros\Desktop\PROD\memolib-production
git checkout -b feature/security-fix-invitations
git bundle create ../memolib-backup.bundle --all
```

**2. Implémenter les 5 patches (utiliser ce document)**

**3. Tester localement:**
```bash
npm run build
npm run dev
# Tester chaque P1 avec les commandes curl du haut
```

**4. Commit:**
```bash
git add -A
git commit -m "fix: security audit P1 fixes (invitations)

- P1-1: Strict email verification (SHA-256 hash + match check)
- P1-2: Atomic transaction for race condition prevention
- P1-3: Tenant verification after acceptance
- P1-4: JSON validation with Zod
- P1-5: Prisma relations + cascade delete

Closes: Security Audit 2026-11-17

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

**5. Code Review + Merge**

---

**Fin du document PHASE1_PATCH_COMPLET.md**

Bon courage ! 🚀 Les patchs sont prêts. À toi de jouer !
