# 🔧 P1-5 FIX — Prisma Relations

**Fichier:** `prisma/schema.prisma`

**TROUVER ces lignes (env. ligne 2070):**

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

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
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

**REMPLACER PAR CECI:**

```prisma
model Invitation {
  id             String   @id @default(cuid())
  email          String
  
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

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum AccessGrantStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

model AccessGrant {
  id             String   @id @default(cuid())
  
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

**PUIS, AJOUTER à model User (env. ligne 950):**

Trouver:
```prisma
model User {
  // ... existing fields ...
  Tenant           Tenant?         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([role])
```

Remplacer par:
```prisma
model User {
  // ... existing fields ...
  Tenant           Tenant?         @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // ✅ Relations for Invitations
  invitationsCreated Invitation[] @relation("InvitationsCreated")
  clientAccess       AccessGrant[] @relation("ClientAccess")

  @@index([role])
```

**PUIS, AJOUTER à model Dossier (env. ligne 230):**

Trouver:
```prisma
model Dossier {
  // ... existing fields ...
  TimeEntry          TimeEntry[]

  @@unique([tenantId, numero])
```

Remplacer par:
```prisma
model Dossier {
  // ... existing fields ...
  TimeEntry          TimeEntry[]
  
  // ✅ Relations for Invitations
  invitations        Invitation[]
  accessGrants       AccessGrant[]

  @@unique([tenantId, numero])
```

---

## 📋 RÉSUMÉ DES MODIFICATIONS

| Location | Change | Type |
|----------|--------|------|
| `model Invitation` | Ajouter @relation sur dossier, lawyer, accessGrants | Major |
| `model AccessGrant` | Ajouter @relation sur invitation, clientUser, dossier | Major |
| `enum AccessGrantStatus` | Créer nouvel enum | New |
| `model User` | Ajouter invitationsCreated, clientAccess relations | Major |
| `model Dossier` | Ajouter invitations, accessGrants relations | Major |

---

## 🚀 EXÉCUTION

**1. Faire les 3 changements ci-dessus dans `prisma/schema.prisma`**

**2. Générer la migration:**
```bash
npx prisma migrate dev --name fix_invitation_relations
```

**3. Vérifier la migration:**
```bash
# Vérifier le fichier généré
cat prisma/migrations/[timestamp]_fix_invitation_relations/migration.sql
```

**4. Tester les relations:**
```bash
npx ts-node -e "
  import { prisma } from '@/lib/prisma';
  
  // Test 1: Vérifier que invitation peut inclure dossier
  const inv = await prisma.invitation.findFirst({
    include: { dossier: true, lawyer: true, accessGrants: true }
  });
  console.log('✅ Invitation with relations:', !!inv?.dossier);
  
  // Test 2: Vérifier que accessGrant peut inclure invitation
  const ag = await prisma.accessGrant.findFirst({
    include: { invitation: true, dossier: true, clientUser: true }
  });
  console.log('✅ AccessGrant with relations:', !!ag?.invitation);
"
```

**5. Build & Dev:**
```bash
npm run build
npm run dev
```

---

## ⚠️ POINTS CRITIQUES

- ✅ Remplace ENTIÈREMENT les anciens modèles (pas de merge manuel)
- ✅ Exécute `npx prisma migrate dev` (sinon Prisma client ne sera pas à jour)
- ✅ Teste les relations avant de continuer
- ⚠️ La migration SQL peut modifier les données existantes (faire un backup d'abord!)

---

**Prêt à appliquer?** 🚀
