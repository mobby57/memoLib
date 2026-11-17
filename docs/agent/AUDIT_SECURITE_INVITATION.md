# 🔐 AUDIT SÉCURITÉ — Flux d'Invitation Client (MemoLib)

**Date:** 2026-11-17  
**Statut:** 🔴 **NON RECOMMANDÉ POUR PRODUCTION**  
**Niveau d'alerte:** Critique (3 vulnérabilités + 2 incohérences majeures)

---

## 📋 RÉSUMÉ EXÉCUTIF

Le flux d'invitation présente **3 risques critiques** et **2 incohérences structurelles** qui doivent être corrigés avant tout déploiement en production.

| Risk | Severity | Type | Impact |
|------|----------|------|--------|
| Email verification | 🔴 CRIT | Logic | Client wrong email → access granted |
| Race condition | 🔴 CRIT | Concurrency | 2 requests → duplicate access grants |
| Expiration logic | 🟠 HIGH | Logic | Invitation expires immediately after accept |
| Prisma relations | 🟠 HIGH | Schema | No FK constraints, orphaned data risk |
| ENV in Git | 🟠 HIGH | Secrets | Potential credential exposure |

---

## 🔍 DÉTAILS PAR COMPOSANT

### **A. ROUTE DE CRÉATION D'INVITATION**
**Fichier:** `src/app/api/dossiers/[id]/invite/route.ts`

#### ✅ Points positifs
```typescript
// 1. Vérification d'authentification ✅
const { userId } = await auth();
if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

// 2. Validation tenant ✅
const dossier = await prisma.dossier.findFirst({
  where: { id: dossierId, OR: [{ lawyerId: userId }, { responsableId: userId }] },
});
if (!dossier) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });

// 3. Email validation ✅
const email = normalizeEmail(rawEmail);
if (!isValidEmail(email)) return NextResponse.json({ error: '...' }, { status: 400 });

// 4. Token generation ✅
const { plainToken, tokenHash } = generateInvitationToken();
// 32 octets random + SHA-256 hash stocké, plainToken jamais en DB
```

#### ❌ Points critiques

**Problème 1: Pas de vérification "doublon" parfaite**
```typescript
const existing = await prisma.invitation.findFirst({
  where: { dossierId, email, status: 'PENDING', expiresAt: { gt: new Date() } },
});
if (existing) {
  return NextResponse.json({
    error: 'Une invitation est déjà en cours pour cet email',
    existingInvitationId: existing.id,
    expiresAt: existing.expiresAt,
  }, { status: 409 });
}
```

**Le risque:** Entre la vérification du doublon et la création (2 appels DB), deux requêtes concurrentes peuvent créer deux invitations pour le même email.

**La correction:** Transaction atomique
```typescript
// À la place de 2 appels séquentiels:
const invitation = await prisma.$transaction(async (tx) => {
  // Check + Create atomiquement
  const existing = await tx.invitation.findFirst({
    where: { dossierId, email, status: 'PENDING', expiresAt: { gt: new Date() } },
  });
  if (existing) throw new Error('Invitation pending');
  
  return tx.invitation.create({
    data: { email, dossierId, lawyerId: userId, tokenHash, expiresAt },
  });
});
```

**Problème 2: Pas de vérification du "responsableId"**
```typescript
// La route utilise [id] pour le dossierId
// Mais l'appel DB cherche lawyerId OU responsableId

// Vérifier que l'avocat ne peut inviter que ses clients, pas ceux d'un colleague
// Si deux avocats partent le même cabinet, verifie tenant AUSSI
```

**La correction:** Ajouter tenant à la vérification
```typescript
const dossier = await prisma.dossier.findFirst({
  where: {
    id: dossierId,
    tenantId: userTenant, // ← S'assurer du tenant aussi
    OR: [{ lawyerId: userId }, { responsableId: userId }],
  },
});
```

---

### **B. ROUTE D'ACCEPTATION D'INVITATION**
**Fichier:** `src/app/api/invitations/accept/route.ts`

#### ✅ Points positifs
```typescript
// 1. Transaction atomique ✅
await prisma.$transaction([
  prisma.accessGrant.create({
    data: { invitationId: invitation.id, clientUserId: userId, expiresAt: invitation.expiresAt },
  }),
  prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'ACCEPTED' },
  }),
]);

// 2. Validation du token ✅
const receivedTokenHash = hashToken(token);
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
});

// 3. Vérification du statut ✅
if (invitation.status !== 'PENDING') return NextResponse.json('Invitation already used', { status: 410 });
```

#### ❌ Points critiques

**Problème 1: Email verification insuffisante**
```typescript
const userEmail = user.emailAddresses[0]?.emailAddress;
if (userEmail !== invitation.email) {
  return new NextResponse('This invitation was not sent to your email address', { status: 403 });
}
```

**Le risque:** `user.emailAddresses[0]` n'est pas nécessairement l'adresse **vérifiée** dans Clerk. 

**Exemple de scénario attaque:**
1. Alice invite bob@example.com
2. Clerk crée un user avec email1=attacker@evil.com, email2=bob@example.com
3. Attacker accepte l'invitation avec email1 (Clerk permet ça)
4. Mais `emailAddresses[0]` = attacker@evil.com ≠ bob@example.com
5. Vérification réussit si Clerk a réordonné la liste
6. OU Vérification échoue mais attacker a créé un user avec le bon email

**La correction:**
```typescript
// Chercher l'email VÉRIFIÉE
const userEmail = user.emailAddresses
  ?.find(e => e.verification?.status === 'verified')
  ?.emailAddress
  || user.primaryEmailAddress?.emailAddress;

if (!userEmail) {
  return new NextResponse('No verified email on account', { status: 403 });
}

if (userEmail !== invitation.email) {
  return new NextResponse('This invitation was not sent to your email address', { status: 403 });
}
```

**Problème 2: Pas de vérification du tenant/dossier après acceptation**
```typescript
// Le code accepte l'invitation et crée AccessGrant
// MAIS il ne vérifie pas que l'AccessGrant est lié au bon tenant

// Si un client accepte une invitation d'un cabinet A,
// mais son AccessGrant pointe sur cabinet B → Problème !
```

**La correction:** Charger le Dossier et vérifier le tenant
```typescript
const invitation = await prisma.invitation.findUnique({
  where: { tokenHash: receivedTokenHash },
  include: { Dossier: true }, // ← Requires relation in Prisma
});

if (!invitation?.Dossier) {
  return new NextResponse('Invalid invitation', { status: 404 });
}

// Vérifier que l'accès n'existe pas déjà
const existingGrant = await prisma.accessGrant.findUnique({
  where: { invitationId: invitation.id },
});

if (existingGrant) {
  return new NextResponse('Invitation already accepted', { status: 410 });
}

// Créer l'accès + mettre à jour invitation
await prisma.$transaction([
  prisma.accessGrant.create({
    data: {
      invitationId: invitation.id,
      clientUserId: userId,
      expiresAt: invitation.expiresAt,
    },
  }),
  prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'ACCEPTED' },
  }),
]);

return NextResponse.json({
  success: true,
  dossierId: invitation.dossierId,
  tenantId: invitation.Dossier.tenantId, // ← Confirm tenant
});
```

**Problème 3: Expiration logic est fautive**
```typescript
if (invitation.expiresAt < new Date()) {
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: 'EXPIRED' },
  });
  return new NextResponse('Invitation has expired', { status: 410 });
}
```

**Le risque:** Si l'invitation expire en même temps que l'acceptation (edge case mineure mais possible avec très court délai ou horloge système), le client peut être accepté malgré une expiration.

**Plus critique:** Après acceptation, le `accessGrant.expiresAt` = `invitation.expiresAt`. Si l'invitation expire 7 jours plus tard, l'accès aussi → Client perd l'accès au dossier !

**La correction:**
```typescript
// AccessGrant ne devrait pas avoir d'expiration automatique
// (ou durée beaucoup plus longue que l'invitation)

await prisma.accessGrant.create({
  data: {
    invitationId: invitation.id,
    clientUserId: userId,
    // expiresAt: Pas d'expiration automatique OU 1 an minimum
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
  },
});

// Pour révoquer, utiliser revokedAt explicite
```

**Problème 4: Pas de validation de la requête JSON**
```typescript
const { token } = await request.json();
if (!token) return new NextResponse('Token is required', { status: 400 });
```

**Le risque:** Si le JSON est mal formé, `request.json()` throw une exception non capturée.

**La correction:**
```typescript
let body;
try {
  body = await request.json();
} catch (e) {
  return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
}

const { token } = body || {};
if (!token || typeof token !== 'string') {
  return NextResponse.json({ error: 'Token is required' }, { status: 400 });
}
```

---

### **C. PAGE D'INVITATION CLIENT**
**Fichier:** `src/app/[locale]/invitation/[token]/page.tsx`

#### ✅ Points positifs
```typescript
// 1. Vérification d'authentification ✅
const { isLoaded, userId } = useAuth();
if (!isLoaded || !userId || !token) return;

// 2. Gestion des erreurs ✅
catch (err: any) {
  setStatus('error');
  setMessage(err.message);
}

// 3. Redirection après succès ✅
setTimeout(() => router.push(`/fr/espace-client/${data.dossierId}`), 2000);
```

#### ⚠️ Points à améliorer

**Problème 1: Pas de vérification que c'est un Client, pas un Avocat**
```typescript
// La page suppose que userId est un client
// Mais rien n'empêche un avocat d'accepter sa propre invitation

// La route back-end devrait vérifier:
// - Le user n'est pas le lawyerId de l'invitation
// - Le user n'a pas déjà un accessGrant pour ce dossier
```

**Problème 2: Le token est exposé dans l'URL**
```typescript
// `/fr/invitation/[token]`
// Le token est en clair dans l'URL, dans les logs, l'historique browser, etc.

// Risque: Si un client partage son lien, quiconque peut accepter
```

**La correction (optionnelle, mais recommandée):**
```typescript
// 1. Token court (5-10 min)
// 2. Token jetable: Après acceptance, le token est invalide
// 3. Rate limit par IP: Max 3 tentatives d'acceptance
// 4. Logs de toutes les acceptations: IP, user-agent, timestamp
```

---

### **D. MODÈLE PRISMA INCOMPLET**
**Fichier:** `prisma/schema.prisma`

#### ❌ Modèles actuels (sans relations)

```prisma
model Invitation {
  id             String   @id @default(cuid())
  email          String
  dossierId      String              // ← FK field MAIS
  lawyerId       String              // ← FK field MAIS
  tokenHash      String   @unique
  expiresAt      DateTime
  status         InvitationStatus @default(PENDING)
  createdAt      DateTime @default(now())
  // ← AUCUNE relation Prisma déclarée !
}

model AccessGrant {
  id             String   @id @default(cuid())
  invitationId   String   @unique     // ← FK field MAIS
  clientUserId   String               // ← FK field MAIS
  expiresAt      DateTime
  revokedAt      DateTime?
  createdAt      DateTime @default(now())
  // ← AUCUNE relation Prisma déclarée !
}
```

#### Le problème structurel

**Postgres a des FK contraintes:**
```sql
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_dossierId_fkey" 
  FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT;
```

**Mais Prisma ignore les contraintes FK qui ne sont pas déclarées en relations.**

Résultat:
- `prisma.invitation.findUnique({ include: { Dossier: true } })` → **COMPILE ERROR** (Dossier not in relation)
- `await prisma.invitation.create(...)` → Crée record SANS vérifier dossier exists
- `await prisma.dossier.delete(...)` → Laisse orphaned invitations si migration mal faire

#### ✅ Schema Prisma CORRECT

```prisma
model Invitation {
  id             String          @id @default(cuid())
  email          String
  dossierId      String
  lawyerId       String
  tokenHash      String          @unique
  expiresAt      DateTime
  status         InvitationStatus @default(PENDING)
  createdAt      DateTime         @default(now())
  
  // ← Ajouter les relations
  Dossier        Dossier         @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  Lawyer         User            @relation(fields: [lawyerId], references: [id], onDelete: Cascade)
  AccessGrant    AccessGrant?    // Inverse relation
  
  @@index([dossierId])
  @@index([lawyerId])
  @@index([expiresAt])
  @@index([status])
}

model AccessGrant {
  id             String          @id @default(cuid())
  invitationId   String          @unique
  clientUserId   String
  expiresAt      DateTime
  revokedAt      DateTime?
  createdAt      DateTime         @default(now())
  
  // ← Ajouter les relations
  Invitation     Invitation      @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  ClientUser     User            @relation(fields: [clientUserId], references: [id], onDelete: Cascade)
  
  @@index([clientUserId])
  @@index([createdAt])
  @@unique([invitationId]) // Déjà présent, OK
}
```

**Ajouter à Dossier:**
```prisma
model Dossier {
  // ... existing fields ...
  Invitation     Invitation[] // Inverse relation
}
```

**Ajouter à User:**
```prisma
model User {
  // ... existing fields ...
  InvitationsSent    Invitation[]      @relation("SentInvitations")
  AccessGrants       AccessGrant[]     @relation("ClientAccess")
}
```

---

### **E. ROUTES D'AUTHENTIFICATION**
**Répertoire:** `src/app/[locale]/auth/`

Contient:
- `error/`
- `forgot-password/`
- `login/`
- `register/`
- `reset-password/`
- `sign-up/`
- `signin/`
- `verify-email/`

#### ✅ Pas de problème détecté
Ces routes utilisent Clerk natif, pas d'appel API sensible exposé.

---

### **F. ROUTE QUICK-INVITE**
**Fichier:** `src/app/api/dossiers/quick-invite/route.ts`

#### ⚠️ Points critiques

**Problème 1: Auto-provisioning du user en production**
```typescript
const ALLOW_AUTO_PROVISION =
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_QUICK_PROVISION === 'true';

// EN PRODUCTION: Si NODE_ENV === 'production'
// ALLOW_AUTO_PROVISION = false
// Bon !
```

**Mais risque:** Si `ALLOW_QUICK_PROVISION` est oublié en prod, personne ne peut créer de cabinet.

**La correction:**
```typescript
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_QUICK_PROVISION !== 'true') {
  return NextResponse.json(
    { error: 'Auto-provisioning disabled in production' },
    { status: 503 }
  );
}
```

**Problème 2: Création de Tenant/User sans vérification**
```typescript
let tenant = await prisma.tenant.findFirst();
if (!tenant) {
  tenant = await prisma.tenant.create({
    data: { id: randomUUID(), name: 'Cabinet Demo', plan: 'PRO' },
  });
}
```

**Le risque:** Dans dev, ce code crée un tenant "Cabinet Demo" à chaque fois qu'aucun tenant n'existe. En prod (avec ALLOW_QUICK_PROVISION), c'est un problème sérieux (tous les users dans le même tenant !).

**La correction:**
```typescript
let tenant = await prisma.tenant.findFirst({
  where: { name: 'Cabinet Demo' } // Chercher le même tenant
});

if (!tenant && process.env.NODE_ENV !== 'production') {
  tenant = await prisma.tenant.create({
    data: { id: randomUUID(), name: 'Cabinet Demo', plan: 'PRO' },
  });
}

if (!tenant) {
  return NextResponse.json(
    { error: 'No tenant provisioned' },
    { status: 500 }
  );
}
```

---

## 🔒 POINTS SECRETS & ENVIRONMENT

### État Git (Critique)

Deux commits contiennent `.env` :
- `98a440e`
- `ffea229`

#### Actions à prendre

```bash
# 1. Vérifier si les secrets sont réels
git show 98a440e:.env
git show ffea229:.env

# 2. Si réel: Rotation immédiate de TOUS les secrets
# - DATABASE_URL → Changer mot de passe DB
# - API keys → Regénérer dans Stripe/Resend/etc
# - JWT keys → Regénérer

# 3. Remove de l'historique
git filter-branch --tree-filter 'rm -f .env*' -- --all
# OU
git-filter-repo --invert-paths --path .env --path .env.local

# 4. Ajouter à .gitignore
echo ".env*" >> .gitignore
git add .gitignore && git commit -m "Add .env to gitignore"

# 5. Force push (attention: ce rewrite historique)
git push -f origin main
```

#### Vérification immédiate
```bash
# Chercher les API keys exposées
git log -S "NEXT_PUBLIC" --all
git log -S "RESEND_API_KEY" --all
git log -S "DATABASE_URL" --all
```

---

## 📋 CHECKLIST AVANT PRODUCTION

- [ ] **Prisma relations:** Ajouter Dossier, Lawyer, ClientUser, Invitation relations
- [ ] **Migration Prisma:** Générer + tester migration avec FK contraintes
- [ ] **Accept route:** Mettre email verification à "verified only"
- [ ] **Accept route:** Vérifier tenant après accept
- [ ] **Accept route:** AccessGrant.expiresAt = 1 an (ou no expire)
- [ ] **Accept route:** JSON validation robuste
- [ ] **Create route:** Transaction atomique check+create
- [ ] **Create route:** Ajouter tenantId à vérification
- [ ] **Quick-invite:** Désactiver auto-provisioning en prod
- [ ] **Git history:** Rotation de secrets + filter-branch
- [ ] **Rate limiting:** Ajouter rate limit sur /api/invitations/accept (3 tentatives/5min par IP)
- [ ] **Logging:** Ajouter logs d'audit (email, IP, timestamp) pour chaque invitation accept
- [ ] **Testing:** Test concurrence avec 2+ requests simultanées
- [ ] **Testing:** Test expiration edge cases
- [ ] **TypeScript:** Vérifier que les nouveaux relations Prisma compilent

---

## 🚀 PLAN DE CORRECTION (PRIORITÉ)

### **P1 — AVANT TOUT DÉPLOIEMENT** (2-3 jours)
1. Rotation des secrets (Git history)
2. Prisma relations + migration
3. Email verification "verified only"
4. Tenant verification après accept
5. JSON validation robuste

### **P2 — AVANT MISE EN PRODUCTION** (1 semaine)
6. Transaction atomique check+create
7. Rate limiting sur accept
8. Audit logging
9. Tests concurrence & expiration
10. Désactiver auto-provisioning prod

### **P3 — POST-GO-LIVE** (2-3 semaines)
11. AccessGrant expiration strategy
12. Client access revocation UI
13. Admin audit dashboard
14. Rate limit monitoring

---

## ✅ RÉSUMÉ FINAL

| Component | Securité | Prêt Prod | Action |
|-----------|----------|-----------|--------|
| Création invitation | 🟠 OK | ❌ NON | P1: Transaction atomique |
| Acceptation invitation | 🔴 CRIT | ❌ NON | P1: Email vérifiée + tenant check |
| Page client | 🟠 OK | ⚠️ CAUTION | P2: Rate limiting |
| Prisma schema | 🔴 CRIT | ❌ NON | P1: Ajouter relations |
| Secrets Git | 🔴 CRIT | ❌ NON | P1: Rotation immédiate |
| Quick-invite | 🟠 MOYEN | ⚠️ CAUTION | P1: Désactiver prod |

---

**Conclusion:** ⛔ **NE PAS DÉPLOYER TANT QUE LES P1 NE SONT PAS CORRIGÉES.**

Estimation: **3-5 jours de travail** pour P1 + P2 complets, incluant tests et vérification.

