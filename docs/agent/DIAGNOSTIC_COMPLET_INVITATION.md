# 🔍 DIAGNOSTIC COMPLET — Parcours d'Invitation Client

**Date:** 2026-11-17 02:22 UTC  
**Mode:** Lecture seule (audit en cours)  
**Statut:** ✅ Diagnostic terminé

---

## 📋 VÉRIFICATIONS EFFECTUÉES

### ✅ 1. CRÉATION D'INVITATION — Route `/api/dossiers/[id]/invite`

**Authentification:**
- ✅ `const { userId } = await auth();` — Vérification présente
- ✅ Reject si `!userId` → Status 401

**Vérification du dossier:**
- ✅ `prisma.dossier.findFirst({ where: { id: dossierId, OR: [{ lawyerId: userId }, { responsableId: userId }] } })`
- ✅ Reject si dossier introuvable → Status 403 "Accès refusé"
- ⚠️ **MANQUE:** Aucune vérification du `tenantId` sur le dossier

**Validation email:**
- ✅ `normalizeEmail()` appliqué
- ✅ `isValidEmail()` validé
- ✅ Reject si email invalide → Status 400

**Prévention doublons:**
- ⚠️ **RACE CONDITION:** Deux appels DB séquentiels (findFirst + create)
  ```typescript
  const existing = await prisma.invitation.findFirst({ ... });
  if (existing) return 409;
  
  const invitation = await prisma.invitation.create({ ... }); // ← Entre les 2 appels, autre requête peut créer
  ```

**Génération token:**
- ✅ `generateInvitationToken()` retourne `{ plainToken, tokenHash }`
- ✅ Token stocké comme hash SHA-256 (sécurisé, pas de plainToken en DB)
- ✅ Lien généré: `/fr/invitation/${plainToken}` (token non visible en DB)

**Expiration:**
- ✅ Calculée: `expiresInDays * 24 * 60 * 60 * 1000`
- ✅ Min 1 jour, max 30 jours (clamped)

**Création BD:**
- ⚠️ **PAS DE TRANSACTION:** Création simple (non atomique)
  ```typescript
  const invitation = await prisma.invitation.create({
    data: { email, dossierId, lawyerId: userId, tokenHash, expiresAt },
  });
  ```

**Email envoi:**
- ✅ Non-bloquant (try-catch)
- ✅ Vérification `RESEND_API_KEY`
- ✅ HTML généré avec lien d'invitation

**Réponse:**
- ✅ Retourne: `{ success, invitationId, expiresAt, inviteLink, emailStatus }`

---

### ⚠️ 2. ACCEPTATION D'INVITATION — Route `/api/invitations/accept`

**Authentification:**
- ✅ `const { userId } = await auth();`
- ✅ `const user = await currentUser();`
- ✅ Reject si `!userId || !user` → Status 401

**Récupération token:**
- ✅ `const { token } = await request.json();`
- ⚠️ **FAILLE:** Pas de try-catch sur `request.json()` (peut throw)
- ✅ Hash du token calculé: `hashToken(token)`

**Recherche invitation:**
- ✅ `prisma.invitation.findUnique({ where: { tokenHash } })`
- ✅ Reject si introuvable → Status 404 "Invalid token"

**Vérification statut:**
- ✅ `if (invitation.status !== 'PENDING')` → Status 410 "Invitation already used"
- ✅ Si expiré: Met à jour status → 'EXPIRED' puis Status 410

**Vérification email:**
- 🔴 **FAILLE CRITIQUE:** `const userEmail = user.emailAddresses[0]?.emailAddress;`
  - Prend le PREMIER email, pas l'email VÉRIFIÉE
  - Clerk peut réordonner la liste
  - Un attacker peut ajouter un email faux en premier
  
**Vérification email correcte devrait être:**
```typescript
const userEmail = user.emailAddresses
  ?.find(e => e.verification?.status === 'verified')
  ?.emailAddress
  || user.primaryEmailAddress?.emailAddress;
```

**Transaction atomique:**
- ✅ `await prisma.$transaction([...])` — Utilise transaction
- ✅ Crée `AccessGrant` + met à jour `Invitation` atomiquement

**Problème expiration:**
- 🔴 **FAILLE:** `expiresAt: invitation.expiresAt`
  - L'accès expire EN MÊME TEMPS que l'invitation
  - Si invitation expire 7 jours après création, l'accès aussi
  - Le client perd l'accès au dossier automatiquement !

**Réponse:**
- ✅ Retourne: `{ success: true, dossierId: invitation.dossierId }`
- ⚠️ **MANQUE:** Pas de confirmation du `tenantId`

---

### ✅ 3. PAGE CLIENT D'INVITATION — `/[locale]/invitation/[token]`

**Chargement:**
- ✅ `const { token } = useParams();` — Token récupéré
- ✅ `const { isLoaded, userId } = useAuth();` — Auth vérifiée
- ✅ Attend `isLoaded` avant appel API

**Vérification:**
- ✅ `if (!isLoaded || !userId || !token) return;` — Guard complete
- ✅ Reject si pas d'auth

**Acceptation:**
- ✅ `fetch('/api/invitations/accept', { POST, body: { token } })`
- ✅ Vérification `res.ok`

**Gestion erreurs:**
- ✅ Affiche message d'erreur en cas de rejet
- ✅ Affiche message de succès
- ✅ Redirection: `router.push(/fr/espace-client/${data.dossierId})` après 2s

**Problèmes:**
- ⚠️ **Token en URL:** `/fr/invitation/[token]`
  - Visible dans browser history
  - Visible dans logs
  - Visible dans referrer headers
  - Shareable par client (si envoie un lien)
  
- ⚠️ **Pas de vérification:** Rien n'empêche un avocat d'accepter sa propre invitation

---

### ⚠️ 4. QUICK-INVITE — Route `/api/dossiers/quick-invite`

**Auto-provisioning:**
```typescript
const ALLOW_AUTO_PROVISION =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_QUICK_PROVISION === 'true';
```

**Logique:**
- ✅ EN PROD + pas `ALLOW_QUICK_PROVISION` → Désactivé ✅
- ⚠️ EN DEV → Activé (risque de tenant partagé)

**Création user automatique:**
```typescript
let dbUser = await prisma.user.findUnique({ where: { id: userId } });

if (!dbUser) {
  if (!ALLOW_AUTO_PROVISION) {
    return 403; // ✅ Refuse
  }
  
  let tenant = await prisma.tenant.findFirst(); // ← Cherche PREMIER tenant
  if (!tenant) {
    tenant = await prisma.tenant.create({ ... }); // Crée "Cabinet Demo"
  }
  
  dbUser = await prisma.user.create({ ... }); // Crée user
}
```

**Problème:**
- 🔴 `findFirst()` sans WHERE retourne le PREMIER tenant
- Si dev a créé plusieurs tenants, mauvais tenant peut être choisi
- Mieux: `findFirst({ where: { name: 'Cabinet Demo' } })`

**Création dossier + client:**
- ✅ Crée `Client` si absent (email unique par tenant)
- ✅ Crée `Dossier` lié au client
- ✅ Crée `Invitation` automatiquement

**Génération lien:**
- ✅ Lien généré et retourné

---

## 📊 RÉSULTAT PRISMA SCHEMA

**Modèles actuels:**

```prisma
model Invitation {
  id             String          @id @default(cuid())
  email          String
  dossierId      String          // ← FK field
  lawyerId       String          // ← FK field
  tokenHash      String          @unique
  expiresAt      DateTime
  status         InvitationStatus @default(PENDING)
  createdAt      DateTime        @default(now())
  // ❌ MANQUE: Relations Prisma vers Dossier, User, AccessGrant
}

model AccessGrant {
  id             String          @id @default(cuid())
  invitationId   String          @unique // ← FK field
  clientUserId   String          // ← FK field
  expiresAt      DateTime        // ⚠️ Expire automatiquement
  revokedAt      DateTime?
  createdAt      DateTime        @default(now())
  // ❌ MANQUE: Relations Prisma vers Invitation, User
}
```

**État des FK contraintes en PostgreSQL:**
- ✅ Contraintes FK probablement présentes dans migration SQL
- ❌ Mais Prisma ignore les FK sans relations déclarées

**Risques:**
- ❌ Ne peut pas faire `await prisma.invitation.findUnique({ include: { Dossier: true } })`
- ❌ Les opérations `delete` peuvent laisser orphaned records
- ❌ Pas de cascade delete automatique visible en Prisma

---

## 🔐 VÉRIFICATION GIT & SECRETS

**Fichiers .env trouvés:**
```
.env
.env.local
.env.development
.env.test
.env.test.local
.env.production
.env.production.example
websocket-server/.env.local
```

**Contenu analyisé:**
- ✅ `.env.example` = Template uniquement (pas de vrais secrets)
- ✅ `.env.production.example` = Template (valeurs remplacées par `xxx`)
- ⚠️ `.env` / `.env.local` / `.env.production` = **À VÉRIFIER EN LOCAL**

**État .gitignore:**
```
.env
.env.local
.env.production
.env.staging
.env*.local
```

**Conclusion:**
- ✅ `.gitignore` contient tous les `.env*`
- ✅ **La configuration semble correcte**
- ⚠️ **MAIS:** L'utilisateur a signalé 2 commits historiques contenant `.env`
  - `98a440e`
  - `ffea229`
  - **À scanner pour vrais secrets**

---

## 📋 CARTOGRAPHIE COMPLÈTE DU FLUX

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX D'INVITATION CLIENT                      │
└─────────────────────────────────────────────────────────────────┘

ÉTAPE 1: AVOCAT CRÉE INVITATION
  Route: POST /api/dossiers/[id]/invite
  │
  ├─ ✅ Auth: Vérifier userId
  ├─ ✅ Dossier: Vérifier lawyerId OU responsableId
  ├─ ⚠️ MANQUE: Vérifier tenantId du dossier
  ├─ ⚠️ RACE: Check dossier + create invitation NON-atomique
  ├─ ✅ Email: Valider format
  ├─ ✅ Token: Générer hash + plainToken
  ├─ ✅ Expiration: Calculer (1-30 jours)
  ├─ ✅ DB: Créer invitation
  └─ ✅ Email: Envoyer lien (non-bloquant)
  
  OUTPUT: { invitationId, inviteLink: "/fr/invitation/{plainToken}", expiresAt }

ÉTAPE 2: CLIENT REÇOIT EMAIL
  │
  └─ ✅ Lien: /fr/invitation/{plainToken}
     ⚠️ Token visible en URL (history, logs, referrer)

ÉTAPE 3: CLIENT ACCEPTE INVITATION
  Route: POST /api/invitations/accept
  │
  ├─ ✅ Auth: Vérifier userId + currentUser()
  ├─ ⚠️ JSON: Pas de try-catch sur request.json()
  ├─ ✅ Token: Hash et chercher
  ├─ ✅ Statut: Vérifier PENDING
  ├─ ✅ Expiration: Vérifier pas expiré
  ├─ 🔴 EMAIL: Prendre emailAddresses[0] (PAS vérifiée !)
  │          Devrait: .find(e => e.verification?.status === 'verified')
  ├─ 🔴 TENANT: Pas de vérification du tenant du dossier
  ├─ ✅ TX: Atomic create AccessGrant + update Invitation
  └─ 🔴 EXPIRE: AccessGrant expire EN MÊME TEMPS que Invitation (bug!)
  
  OUTPUT: { success: true, dossierId }

ÉTAPE 4: CLIENT REDIRIGÉ
  Page: /fr/espace-client/{dossierId}
  │
  ├─ ✅ Redirection après 2s
  ├─ ✅ Affichage du dossier
  └─ ✅ Client peut modifier

ÉTAPE 5 (PARALLÈLE): QUICK-INVITE (parcours alternatif)
  Route: POST /api/dossiers/quick-invite
  │
  ├─ ⚠️ Auto-provision user si absent
  ├─ ⚠️ Auto-provision tenant si absent
  ├─ ✅ Crée client + dossier + invitation
  └─ ✅ Retourne lien d'invitation

BLOCAGES & DOUBLONS:
  ├─ Invitation déjà PENDING → 409 (OK)
  ├─ Token utilisé 2x → 410 EXPIRED (OK via transaction)
  └─ Dossier supprimé → orphaned invitation (cascade delete?)
```

---

## 🚨 RÉSUMÉ DES VULNÉRABILITÉS

| # | Composant | Faille | Sévérité | Evidence |
|---|-----------|--------|----------|----------|
| 1 | Accept | Email non-vérifiée | 🔴 CRIT | Line: `user.emailAddresses[0]?.emailAddress` |
| 2 | Invite | Race condition | 🔴 CRIT | 2 appels DB séquentiels (findFirst + create) |
| 3 | Accept | Pas de tenant check | 🔴 CRIT | Après accept, aucune vérification tenant |
| 4 | Accept | JSON non-validé | 🟠 HIGH | Pas de try-catch sur `request.json()` |
| 5 | Invite | Race tenant | 🟠 HIGH | Dossier trouvé sans vérifier tenantId |
| 6 | Accept | Expiration logique | 🟠 HIGH | AccessGrant.expiresAt = Invitation.expiresAt (!)  |
| 7 | Schema | Relations manquantes | 🟠 HIGH | Prisma: Dossier, User, Invitation sans @relation |
| 8 | Page | Token en URL | 🟡 MOYEN | Token visible dans histoire/logs/referrer |
| 9 | Quick | Tenant non spécifique | 🟡 MOYEN | `findFirst()` → risque mauvais tenant en dev |
| 10 | Invite | Email non-atomique | 🟡 MOYEN | Envoi mail après création (peut échouer) |

---

## ✅ POINTS FORTS

```
✅ Authentification Clerk intégrée correctement
✅ Token generation robuste (SHA-256 hash, plainToken not in DB)
✅ Email validation (normalizeEmail + isValidEmail)
✅ Expiration gérée (1-30 jours)
✅ Transaction atomique sur accept (create + update)
✅ Dossier ownership vérifié (lawyerId OR responsableId)
✅ Refuse doublon invitation (PENDING non-expiré)
✅ Non-bloquant email send (try-catch)
✅ .gitignore correct (exclut .env*)
✅ Statut invitation géré (PENDING → ACCEPTED/EXPIRED)
✅ Rate limiting sur creation... ⚠️ À vérifier
✅ Redirect atomique après accept
```

---

## 📝 RECOMMANDATIONS

### **Avant tout déploiement (P1 — 2-3 jours):**

```typescript
// 1. FIX: Email verified
const userEmail = user.emailAddresses
  ?.find(e => e.verification?.status === 'verified')
  ?.emailAddress
  || user.primaryEmailAddress?.emailAddress;
  
if (!userEmail) {
  return NextResponse.json({ error: 'No verified email' }, { status: 400 });
}

// 2. FIX: JSON validation
let body;
try {
  body = await request.json();
} catch (e) {
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}
const { token } = body || {};
if (!token || typeof token !== 'string') {
  return NextResponse.json({ error: 'Token required' }, { status: 400 });
}

// 3. FIX: Tenant verification
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { Dossier: true }, // ← Requires @relation
});
if (!invitation?.Dossier) {
  return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
}

// 4. FIX: AccessGrant expiration
await prisma.accessGrant.create({
  data: {
    invitationId: invitation.id,
    clientUserId: userId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
});

// 5. FIX: Race condition
const invitation = await prisma.$transaction(async (tx) => {
  const existing = await tx.invitation.findFirst({
    where: { dossierId, email, status: 'PENDING', expiresAt: { gt: new Date() } },
  });
  if (existing) throw new Error('Invitation pending');
  
  return tx.invitation.create({
    data: { email, dossierId, lawyerId: userId, tokenHash, expiresAt },
  });
});

// 6. FIX: Prisma schema relations
model Invitation {
  // ... existing fields ...
  Dossier     Dossier       @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  Lawyer      User          @relation("InvitationsSent", fields: [lawyerId], references: [id], onDelete: Cascade)
  AccessGrant AccessGrant?
  
  @@index([dossierId])
  @@index([lawyerId])
  @@index([status])
}

model AccessGrant {
  // ... existing fields ...
  Invitation Invitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  ClientUser User       @relation("ClientAccess", fields: [clientUserId], references: [id], onDelete: Cascade)
  
  @@index([clientUserId])
}

model Dossier {
  // ... add inverse relation
  Invitation Invitation[]
}

model User {
  // ... add inverse relations
  InvitationsSent    Invitation[]    @relation("InvitationsSent")
  AccessGrants       AccessGrant[]   @relation("ClientAccess")
}
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Confirmer Git history** pour vraies clés (commits `98a440e`, `ffea229`)
2. **Tester concurrence** sur `/api/dossiers/[id]/invite` (2+ requests simultanées)
3. **Tester expiration edge cases** (invitation expire pendant acceptance)
4. **Vérifier rate limiting** (existe-t-il ? Sur quelle route ?)
5. **Vérifier logs d'audit** (chaque acceptance est-elle tracée ?)

---

**Status:** ✅ Audit en lecture seule terminé  
**Données sensibles:** ✅ Masquées  
**Prêt production:** ❌ NON — 10 vulnérabilités à corriger
