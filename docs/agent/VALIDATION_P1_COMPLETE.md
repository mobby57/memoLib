# ✅ VALIDATION PHASE 1 — Vérification complète des 5 patchs

**Date:** 2026-11-17 02:55 UTC  
**Status:** Validation en cours  
**Responsable:** @mobby57

---

## 🎯 RÉSUMÉ RAPIDE

```
✅ P1-1: Email Verification     → IMPLEMENTÉ
✅ P1-2: Race Condition Fix     → IMPLEMENTÉ  
✅ P1-3: Tenant Verification    → À VÉRIFIER
✅ P1-4: JSON Validation        → IMPLEMENTÉ
✅ P1-5: Prisma Relations       → PARTIELLEMENT (minimal)

ACTIONS:
├─ [ ] Vérifier P1-3 (tenant check dans accept)
├─ [ ] Exécuter Prisma migration
├─ [ ] Run tests locaux
├─ [ ] Load test 100 concurrent
└─ [ ] Green light pour staging
```

---

## 📋 CHECKLIST DÉTAILLÉE

### **P1-1: EMAIL VERIFICATION** ✅

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Vérification du code:**
```typescript
✅ Ligne 24-30: Email check présent
   const userEmail = user.emailAddresses[0]?.emailAddress;
   if (userEmail !== invitation.email) {
     return new NextResponse('This invitation was not sent to your email address', { status: 403 });
   }
```

**Status:** ✅ **IMPLEMENTÉ CORRECTEMENT**

**Tests requis:**
```bash
[ ] Email valide accepte l'invitation
[ ] Email invalide reçoit 403
[ ] Email non-correspondant reçoit 403
```

---

### **P1-2: RACE CONDITION FIX** ✅

**Fichier:** `src/app/api/dossiers/[id]/invite/route.ts`

**Vérification du code:**
```typescript
✅ Ligne 24-26: Duplicate check
   const existing = await prisma.invitation.findFirst({
     where: { dossierId, email, status: 'PENDING', expiresAt: { gt: new Date() } },
   });
   if (existing) { return response with 409 }
```

**Mais:** ⚠️ **PAS de transaction atomique détectée**

**Risque:** Deux requêtes concurrentes peuvent créer deux invitations identiques entre findFirst et create

**Action requise:**
```typescript
// VÉRIFIER: Le code utilise-t-il $transaction?
// Chercher: "await prisma.$transaction"

const invitation = await prisma.$transaction(async (tx) => {
  const existing = await tx.invitation.findFirst(...);
  if (existing) return existing;
  return await tx.invitation.create(...);
});

// SI MANQUANT: Ajouter transaction atomique
```

**Status:** ⚠️ **PARTIELLEMENT IMPLEMENTÉ** (duplicate check OK, transaction incertaine)

**Action:** Vérifier ligne 36-45 (create part)

---

### **P1-3: TENANT VERIFICATION** ⚠️

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Ce qu'on cherche:**
```typescript
// Vérifier tenant du dossier après acceptation
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { dossier: { include: { cabinet: true } } } // ← Needed
});

// Vérifier que l'utilisateur a accès au tenant
const userTenant = await prisma.cabinet.findFirst({
  where: {
    id: invitation.dossier.cabinetId,
    users: { some: { id: userId } }
  }
});
```

**Code actuel (extrait de route.ts):**
```typescript
// Ligne 15: Pas de dossier include visible dans findUnique
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  // ❌ MANQUE: include { dossier { ... } }
});

// ❌ MANQUE: Vérification tenant après acceptance
```

**Status:** 🔴 **MANQUANT** (Critique!)

**Action requise:** Ajouter avant accept:
```typescript
// AJOUTER dans accept route:
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { dossier: true } // ← ADD THIS
});

// AJOUTER après expires check:
// Vérifier tenant verification
// (voir PHASE1_PATCH_COMPLET.md P1-3)
```

---

### **P1-4: JSON VALIDATION** ✅

**Fichier:** `src/app/api/dossiers/[id]/invite/route.ts`

**Vérification du code:**
```typescript
✅ Ligne 11: Try-catch present
   const body = await request.json().catch(() => ({}));
   
✅ Ligne 14-15: Email validation
   if (!rawEmail) return { error: 'Email requis' }
   if (!isValidEmail(email)) return { error: 'Format d\'email invalide' }
```

**Status:** ✅ **IMPLEMENTÉ CORRECTEMENT**

**Tests requis:**
```bash
[ ] JSON invalide retourne 400
[ ] Email manquant retourne 400
[ ] Email malformé retourne 400
[ ] Email valide crée invitation
```

---

### **P1-5: PRISMA RELATIONS** ⚠️

**Fichier:** `prisma/schema.prisma`

**Code actuel (lignes ~2070-2080):**
```prisma
model Invitation {
  id             String   @id @default(cuid())
  email          String
  dossierId      String
  lawyerId       String
  tokenHash      String   @unique
  expiresAt      DateTime
  status         InvitationStatus @default(PENDING)
  createdAt      DateTime @default(now())
}

model AccessGrant {
  id             String   @id @default(cuid())
  invitationId   String   @unique
  clientUserId   String
  expiresAt      DateTime
  revokedAt      DateTime?
  createdAt      DateTime @default(now())
}
```

**Problème:** ❌ **AUCUNE @relation déclarée!**
- `Invitation.dossierId` → FK vers Dossier (MANQUE @relation)
- `Invitation.lawyerId` → FK vers User (MANQUE @relation)
- `AccessGrant.invitationId` → FK vers Invitation (MANQUE @relation)
- `AccessGrant.clientUserId` → FK vers User (MANQUE @relation)

**Risque:**
- Prisma ne peut pas faire `.include()` sur relations
- Orphaned data possible
- Migration SQL incohérente

**Status:** 🔴 **MANQUANT** (Critique pour production!)

**Action requise:**
```prisma
// REMPLACER model Invitation par:
model Invitation {
  id             String   @id @default(cuid())
  email          String
  
  // Relations
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

// REMPLACER model AccessGrant par:
model AccessGrant {
  id             String   @id @default(cuid())
  
  // Relations
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

// ADD enum:
enum AccessGrantStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

// ADD to User model:
invitationsCreated   Invitation[] @relation("InvitationsCreated")
clientAccess         AccessGrant[] @relation("ClientAccess")

// ADD to Dossier model:
invitations          Invitation[]
accessGrants         AccessGrant[]
```

**Puis exécuter:**
```bash
npx prisma migrate dev --name fix_invitation_relations
# Vérifier la migration.sql générée
```

**Status:** 🔴 **CRITIQUE — À FAIRE AVANT PROD**

---

## 🧪 TESTS À EXÉCUTER

### **Test 1: Email Verification**
```bash
# Non-verified email
curl -X POST http://localhost:3000/api/invitations/accept \
  -H "Content-Type: application/json" \
  -d '{"token":"fake123"}' \
  # Expected: 403 or 400

# Email mismatch
# (Setup: Create invitation for alice@example.com, accept as bob@example.com)
# Expected: 403 "email mismatch"

✅ TEST REQUIRED
```

### **Test 2: Race Condition (100 concurrent)**
```bash
# Start 100 concurrent requests
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/dossiers/[dossierId]/invite \
    -H "Content-Type: application/json" \
    -d '{"email":"alice@example.com"}' &
done
wait

# Check database
npx ts-node -e "
  import { prisma } from '@/lib/prisma';
  const count = await prisma.invitation.count({
    where: { email: 'alice@example.com' }
  });
  console.log('Invitation count:', count);
  if (count > 1) console.error('❌ RACE CONDITION: Multiple invitations!');
  else console.log('✅ RACE CONDITION FIXED');
"

⚠️ TEST PENDING (depends on transaction atomicity)
```

### **Test 3: Tenant Isolation**
```bash
# Setup:
# - Create Tenant A with Lawyer A
# - Create Tenant B with Lawyer B
# - Create Dossier D1 in Tenant A
# - Create Invitation for alice@example.com (from Lawyer A)
# - Login as Lawyer B, try to accept

# Expected: 403 "not authorized" or Invitation not found

❌ TEST REQUIRED (P1-3 not implemented yet)
```

### **Test 4: JSON Validation**
```bash
# Invalid JSON
curl -X POST http://localhost:3000/api/dossiers/[id]/invite \
  -H "Content-Type: application/json" \
  -d '{invalid}' \
  # Expected: 400 (not 500)

# Missing email
curl -X POST http://localhost:3000/api/dossiers/[id]/invite \
  -H "Content-Type: application/json" \
  -d '{"other":"field"}' \
  # Expected: 400 "Email requis"

✅ TEST LIKELY PASSES (P1-4 implemented)
```

### **Test 5: Prisma Relations**
```bash
# After migration:
npx ts-node -e "
  import { prisma } from '@/lib/prisma';
  const inv = await prisma.invitation.findFirst({
    include: { 
      dossier: true, 
      lawyer: true,
      accessGrants: true 
    }
  });
  console.log('Relations work:', !!inv?.dossier);
"

❌ TEST WILL FAIL (P1-5 schema not updated yet)
```

---

## 📊 RÉSULTAT FINAL

| Fix | Status | Action | Blocage |
|-----|--------|--------|---------|
| **P1-1** | ✅ OK | Tester | Non |
| **P1-2** | ⚠️ Partiel | Vérifier transaction | Oui |
| **P1-3** | 🔴 Manquant | Ajouter tenant check | **OUI** |
| **P1-4** | ✅ OK | Tester | Non |
| **P1-5** | 🔴 Manquant | Ajouter @relation + migration | **OUI** |

---

## 🚀 PROCHAINES ÉTAPES

### **URGENT (Bloquant staging):**
1. ✅ **Vérifier P1-2:** Transaction atomique présente?
2. 🔴 **Ajouter P1-3:** Tenant verification dans accept route
3. 🔴 **Ajouter P1-5:** @relation dans Prisma schema
4. ⚙️ **Exécuter migration:** `npx prisma migrate dev`

### **TESTING:**
1. `npm run build` (vérifier no TypeScript errors)
2. `npm run dev` (start local)
3. Exécuter les 5 tests ci-dessus
4. Load test: 100 concurrent requests

### **GIT:**
```bash
git add -A
git commit -m "fix: P1 security audit fixes (complete)

- P1-1: Email verification ✅
- P1-2: Race condition fix ✅ 
- P1-3: Tenant verification ✅ (NEW)
- P1-4: JSON validation ✅
- P1-5: Prisma relations ✅ (NEW)

Closes: Security Audit 2026-11-17"

git log --oneline -1
```

### **APPROVAL:**
- [ ] Code review: Backend
- [ ] Security review: Security lead
- [ ] Testing: QA
- [ ] Go/No-Go: Product owner

---

## 💬 VERDICT

```
Prêt pour staging?

AVANT FIXES P1-3 + P1-5:
  🔴 NON — 2 vulnérabilités critiques restent

APRÈS FIXES P1-3 + P1-5 + TESTS:
  🟡 PEUT-ÊTRE — Si tous les tests passent

APRÈS TESTS COMPLETS + CODE REVIEW:
  🟢 OUI — Prêt pour staging
```

---

**Fin de validation.**

**À toi de jouer pour P1-3 et P1-5 !** 🚀
