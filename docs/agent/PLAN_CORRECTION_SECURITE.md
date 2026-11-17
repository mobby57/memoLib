# 🛠️ PLAN DE CORRECTION SÉCURITÉ — MemoLib Invitation Flow

**Date:** 2026-11-17 02:25 UTC  
**Statut:** 📋 Plan détaillé (prêt pour exécution)  
**Scope:** 10 vulnérabilités identifiées, 3 phases de correction

---

## 📊 RÉSUMÉ EXÉCUTIF

```
Vulnérabilités identifiées: 10
Sévérité critique: 3
Sévérité haute: 4
Sévérité moyenne: 3

Temps estimation:
├─ P1 (avant prod): 2-3 jours
├─ P2 (post go-live): 1 semaine
└─ P3 (optionnel): 2-3 semaines

NON-MODIFIABLE JUSQU'À ACCORD: Aucun fichier ne sera modifié.
```

---

## 🎯 PHASE 1 — AVANT PRODUCTION (2-3 jours)

**Bloquant pour déploiement.** Ces 5 corrections doivent être testées et déployées avant tout lancement.

### **P1-1: Email Verification (CRITIQUE)**

**Faille:** `user.emailAddresses[0]?.emailAddress` → premier email, pas vérifiée

**Impact:** Attacker peut accepter invitation destinée à autre email

**Fichier:** `src/app/api/invitations/accept/route.ts` (ligne ~25)

**Correction:**
```typescript
// AVANT (vulnérable)
const userEmail = user.emailAddresses[0]?.emailAddress;

// APRÈS (sécurisé)
const userEmail = user.emailAddresses
  ?.find(e => e.verification?.status === 'verified')
  ?.emailAddress
  || user.primaryEmailAddress?.emailAddress;

if (!userEmail) {
  return NextResponse.json(
    { error: 'No verified email on your Clerk account' },
    { status: 400 }
  );
}
```

---

### **P1-2: Race Condition Invite (CRITIQUE)**

**Faille:** Deux appels DB séquentiels → 2 requêtes concurrentes créent 2 invitations

**Impact:** Doublon d'invitation pour même email/dossier

**Fichier:** `src/app/api/dossiers/[id]/invite/route.ts` (ligne ~25-50)

**Correction:** Utiliser transaction atomique
```typescript
// AVANT (vulnérable)
const existing = await prisma.invitation.findFirst({ ... });
if (existing) return 409;
const invitation = await prisma.invitation.create({ ... });

// APRÈS (sécurisé avec transaction)
const invitation = await prisma.$transaction(async (tx) => {
  const existing = await tx.invitation.findFirst({ ... });
  if (existing) throw new Error('INVITATION_PENDING');
  return tx.invitation.create({ ... });
});
```

---

### **P1-3: Tenant Verification (CRITIQUE)**

**Faille:** Après acceptation, zéro vérification du tenant du dossier

**Impact:** Client peut accepter invitation et accéder dossier d'autre cabinet

**Fichier:** `src/app/api/invitations/accept/route.ts` (ajouter après accept)

**Correction:**
```typescript
// AVANT
const invitation = await prisma.invitation.findUnique({ ... });

// APRÈS
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { Dossier: true }, // ← Requires @relation in schema
});

if (!invitation?.Dossier) {
  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}
```

---

### **P1-4: JSON Validation (HIGH)**

**Faille:** Pas de try-catch sur `request.json()` → crash server

**Impact:** DoS potentiel, erreur 500

**Fichier:** `src/app/api/invitations/accept/route.ts` (ligne 10)

**Correction:**
```typescript
// AVANT
const { token } = await request.json();

// APRÈS
let body;
try {
  body = await request.json();
} catch (e) {
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}
const { token } = body || {};
```

---

### **P1-5: Prisma Relations (HIGH)**

**Faille:** Modèles Invitation, AccessGrant sans @relation vers Dossier, User

**Impact:** Orphaned records, pas d'include/select, data inconsistency

**Fichier:** `prisma/schema.prisma`

**Correction:**
```prisma
// AJOUTER à Invitation model
Dossier  Dossier  @relation(fields: [dossierId], references: [id], onDelete: Cascade)
Lawyer   User     @relation("InvitationsSent", fields: [lawyerId], references: [id], onDelete: Cascade)
AccessGrant AccessGrant?

// AJOUTER à AccessGrant model
Invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
ClientUser User       @relation("ClientAccessGrants", fields: [clientUserId], references: [id], onDelete: Cascade)

// AJOUTER à User model (append)
InvitationsSent    Invitation[]    @relation("InvitationsSent")
ClientAccessGrants AccessGrant[]   @relation("ClientAccessGrants")

// AJOUTER à Dossier model (append)
Invitation Invitation[]

// PUIS: npx prisma migrate dev --name "add-invitation-relations"
```

---

## 🔄 PHASE 2 — POST GO-LIVE (1 semaine)

### **P2-1: Expiration Logic Fix**

**Problème:** Client perd accès après 7 jours (AccessGrant.expiresAt = Invitation.expiresAt)

**Correction:**
```typescript
// AVANT
expiresAt: invitation.expiresAt, // ❌ Expire avec invitation!

// APRÈS
expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
```

---

### **P2-2: Rate Limiting**

Max 3 tentatives par IP / 5 minutes sur `/api/invitations/accept`

Utiliser `@upstash/ratelimit` (si Redis disponible)

---

### **P2-3: Audit Logging**

Log chaque acceptation avec: IP, timestamp, user, dossier

---

### **P2-4: Tenant Verification on Invite**

Route création doit vérifier `tenantId` du dossier

---

### **P2-5: Token Expiration Shorter**

Réduire: 7-30 jours → 1-2 jours max

---

## 📋 PHASE 3 — OPTIONAL (2-3 semaines)

### **P3-1: Token Protection**

Passer token du POST body plutôt qu'en URL

### **P3-2: Access Revocation UI**

Admin peut révoquer AccessGrant explicitement

### **P3-3: IP Whitelisting**

Whitelister IPs pour acceptation (si nécessaire)

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### **Avant P1:**
```
[ ] Backup database (complet)
[ ] Backup Git repo (complet)
[ ] Créer branche: feature/security-fix-invitations
[ ] Créer PR draft
```

### **P1 Exécution:**
```
[ ] P1-1: Email verification fix + test local
[ ] P1-2: Race condition fix + load test local
[ ] P1-3: Prisma relations + migration test
[ ] P1-4: JSON validation fix + test
[ ] P1-5: Run full migration + verify FK
[ ] PR review + approval
[ ] Merge à main
[ ] Deploy to staging
[ ] E2E tests on staging
```

### **Staging Verification (12-24h):**
```
[ ] Accept invitation flow works end-to-end
[ ] Doublon invitation test passes
[ ] Tenant verification works
[ ] JSON validation works
[ ] Rate limiting works
[ ] Audit logs present
[ ] No orphaned data
[ ] Load test 100 concurrent invites
```

### **Production Deployment:**
```
[ ] Coordonner downtime si nécessaire
[ ] Deploy code
[ ] Run migration
[ ] Verify FK constraints
[ ] Smoke test: Create → Accept → Access
[ ] Monitor errors (1h)
[ ] Monitor performance (1h)
```

---

## 🧪 TEST PLAN

### **Unit Tests:**
- P1-1: Reject unverified email
- P1-2: Race condition handled (100 concurrent)
- P1-3: Tenant verification works
- P1-4: JSON validation (invalid JSON → 400)
- P1-5: Prisma relations load correctly

### **E2E Tests:**
1. Happy path: Create → Send → Accept → Access
2. Error paths: Expired, used, wrong email, rate limit, JSON error
3. Load: 100 concurrent creates/accepts

---

## 📌 POINTS CRITIQUES

1. **Ne rien modifier sans accord** ✅
2. **Tester localement d'abord** ✅
3. **Prisma migration peut être longue** ⚠️
4. **Rate limiting requiert Redis** ⚠️
5. **Backup AVANT migration** 🔴 CRITIQUE

---

## 🎯 RÉSUMÉ FINAL

| Phase | Priorité | Temps | Risque | Action |
|-------|----------|-------|--------|--------|
| P1 | CRITIQUE | 2-3j | HAUT | Bloquant prod |
| P2 | HAUTE | 1 sem | MOYEN | Post go-live |
| P3 | BASSE | 2-3sem | BAS | Nice to have |

**Status:** 📋 Plan prêt pour exécution

---

**Ce document ne contient aucune modification réelle.**  
**Tous les patchs sont des suggestions testables avant deployment.**  
**Zéro commit, zéro push, zéro migration tant que l'accord n'est pas donné.**
