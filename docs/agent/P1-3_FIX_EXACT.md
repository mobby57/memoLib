# 🔧 P1-3 FIX — Tenant Verification

**Fichier:** `src/app/api/invitations/accept/route.ts`

**Remplacer les lignes 15-26 par ceci:**

```typescript
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/invitations';

export async function POST(request: Request) {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return new NextResponse('Unauthorized', { status: 401 });

  const { token } = await request.json();
  if (!token) return new NextResponse('Token is required', { status: 400 });

  const receivedTokenHash = hashToken(token);

  // ✅ P1-3: Inclure dossier dans la requête
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash: receivedTokenHash },
    include: { dossier: true }, // ← AJOUTER CETTE LIGNE
  });

  if (!invitation) return new NextResponse('Invalid token', { status: 404 });
  if (invitation.status !== 'PENDING') return new NextResponse('Invitation already used', { status: 410 });
  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return new NextResponse('Invitation has expired', { status: 410 });
  }

  // Vérification de l'email (le client doit être connecté avec le bon email)
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (userEmail !== invitation.email) {
    return new NextResponse('This invitation was not sent to your email address', { status: 403 });
  }

  // ✅ P1-3: Vérifier que l'utilisateur a accès au tenant/cabinet du dossier
  // Note: Adapter selon ta structure (cabinetId, tenantId, etc.)
  if (!invitation.dossier) {
    return new NextResponse('Associated dossier not found', { status: 404 });
  }

  // Vérifier que l'utilisateur est member du tenant/cabinet du dossier
  const userInTenant = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: invitation.dossier.tenantId, // ← Vérifier tenant match
    },
  });

  if (!userInTenant) {
    return new NextResponse('You are not authorized to access this dossier', { status: 403 });
  }

  // Création de l'accès et mise à jour de l'invitation
  await prisma.$transaction([
    prisma.accessGrant.create({
      data: { 
        invitationId: invitation.id, 
        clientUserId: userId, 
        expiresAt: invitation.expiresAt,
        dossierId: invitation.dossierId, // ← Ajouter pour P1-5
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  return NextResponse.json({ success: true, dossierId: invitation.dossierId });
}
```

**Résumé des changements:**
1. ✅ Ligne 20: `include: { dossier: true }`
2. ✅ Lignes 36-54: Vérifier que dossier existe ET que utilisateur a accès au tenant
3. ✅ Ligne 60: Ajouter `dossierId` au accessGrant.create (pour P1-5)

**Tests après:**
```bash
npm run build
npm run dev
# Test: Accepter invitation avec bon email → SUCCESS
# Test: Accepter invitation avec mauvais tenant → 403
```
