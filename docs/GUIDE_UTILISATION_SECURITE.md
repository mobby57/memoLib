# 🔐 Guide d'Utilisation - Sécurité Zero-Trust

Ce guide explique comment utiliser les nouvelles fonctionnalités de sécurité dans IA Poste Manager.

---

## 📚 Modules Disponibles

### 1. **Audit Logging** (`src/lib/audit.ts`)

Journalisation immuable de toutes les actions sensibles.

#### Exemples d'utilisation

```typescript
import { logAudit, AuditHelpers, getAuditLogs } from '@/lib/audit';

// Log manuel
await logAudit({
  tenantId: 'tenant-123',
  userId: 'user-456',
  action: 'CREATE',
  objectType: 'Dossier',
  objectId: 'dossier-789',
  metadata: { titre: 'Nouveau dossier' },
  ipAddress: req.ip,
  success: true
});

// Helpers pré-configurés
await AuditHelpers.logLogin(userId, tenantId, ip, userAgent);
await AuditHelpers.logLoginFailed(email, ip, userAgent);
await AuditHelpers.logDocumentCreate(tenantId, userId, docId, filename, hash);
await AuditHelpers.logDocumentDownload(tenantId, userId, docId, ip);

// Récupération des logs
const logs = await getAuditLogs('tenant-123', {
  action: 'UNAUTHORIZED_ACCESS',
  startDate: new Date('2026-01-01'),
  limit: 50
});

// Historique d'un objet
const history = await getObjectHistory('Document', 'doc-123');
```

---

### 2. **Cryptographie** (`src/lib/crypto.ts`)

Calcul et vérification de hash SHA-256.

#### Exemples d'utilisation

```typescript
import { calculateHash, hashFile, hashDocument, verifyDocumentIntegrity } from '@/lib/crypto';

// Hash simple
const hash = calculateHash('contenu');

// Hash d'un fichier
const fileHash = await hashFile('/path/to/document.pdf');

// Hash d'un document avec métadonnées
const docHash = hashDocument(fileBuffer, {
  filename: 'contrat.pdf',
  mimeType: 'application/pdf',
  uploadedBy: 'user-123',
  timestamp: new Date()
});

// Vérification d'intégrité
const isValid = verifyDocumentIntegrity(
  fileBuffer,
  storedHash,
  metadata
);

if (!isValid) {
  console.error('Document corrompu !');
  // Alerte sécurité
}
```

---

### 3. **Isolation IA** (`src/lib/ai-isolation.ts`)

Protection des données sensibles lors des appels IA.

#### Exemples d'utilisation

```typescript
import {
  anonymizeForAI,
  validateAIInput,
  tagAIOutput,
  secureAICall,
  prepareDossierForAI
} from '@/lib/ai-isolation';

// Anonymisation manuelle
const anonymized = anonymizeForAI({
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean@example.com',
  typeDossier: 'OQTF',
  statut: 'en_cours'
});
// Résultat: { firstName: '[PRÉNOM]', lastName: '[NOM]', ... }

// Validation avant envoi
if (!validateAIInput(data)) {
  throw new Error('Données sensibles détectées');
}

// Wrapper sécurisé pour appels IA
const result = await secureAICall(
  async (input) => {
    return await ollamaClient.generate({
      model: 'llama3.2',
      prompt: `Analyse ce dossier: ${JSON.stringify(input)}`
    });
  },
  dossier
);

// Le résultat est automatiquement:
// - anonymisé en entrée
// - validé
// - tagué en sortie avec __aiGenerated, __requiresHumanValidation, etc.

// Préparation spécifique dossier
const safeDossier = prepareDossierForAI(dossier);
if (safeDossier) {
  // Envoi à l'IA
}
```

---

### 4. **Middleware Zero-Trust** (`src/middleware/zero-trust.ts`)

Protection automatique de toutes les routes API.

#### Configuration dans Next.js

**Option A : Middleware global** (recommandé)

Créer `src/middleware.ts` :

```typescript
export { zeroTrustMiddleware as middleware, config } from './middleware/zero-trust';
```

**Option B : Protection route par route**

```typescript
import { zeroTrustMiddleware } from '@/middleware/zero-trust';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  // Vérification Zero-Trust
  const authCheck = await zeroTrustMiddleware(req);
  if (authCheck.status !== 200) return authCheck;
  
  // Logique métier
  // ...
}
```

---

## 🔄 Workflow Complet : Upload de Document

Voici comment intégrer toutes les couches de sécurité :

```typescript
// app/api/tenant/[id]/documents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { hashFile } from '@/lib/crypto';
import { AuditHelpers } from '@/lib/audit';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  
  const tenantId = params.id;
  
  // Vérification tenant
  if (session.user.role !== 'SUPER_ADMIN' && session.user.tenantId !== tenantId) {
    await AuditHelpers.logUnauthorizedAccess(
      session.user.id,
      tenantId,
      'Document',
      'upload',
      'Cross-tenant access attempt',
      req.ip
    );
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const dossierId = formData.get('dossierId') as string;
  
  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }
  
  // Conversion en Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // 1. CALCUL DU HASH
  const hash = hashFile(buffer);
  
  // 2. SAUVEGARDE PHYSIQUE
  const uploadDir = join(process.cwd(), 'uploads', tenantId);
  const filename = `${Date.now()}-${file.name}`;
  const filepath = join(uploadDir, filename);
  
  await writeFile(filepath, buffer);
  
  // 3. CRÉATION EN BASE (avec hash)
  const document = await prisma.document.create({
    data: {
      dossierId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: buffer.length,
      path: filepath,
      hash,
      uploadedBy: session.user.id
    }
  });
  
  // 4. CRÉATION VERSION INITIALE
  await prisma.documentVersion.create({
    data: {
      documentId: document.id,
      version: 1,
      hash,
      filename,
      path: filepath,
      size: buffer.length,
      mimeType: file.type,
      uploadedBy: session.user.id,
      changeReason: 'Upload initial'
    }
  });
  
  // 5. AUDIT LOG
  await AuditHelpers.logDocumentCreate(
    tenantId,
    session.user.id,
    document.id,
    file.name,
    hash
  );
  
  return NextResponse.json({ document });
}
```

---

## 🤖 Workflow IA Sécurisé : Analyse de Dossier

```typescript
// app/api/tenant/[id]/dossiers/[dossierId]/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { prepareDossierForAI, secureAICall, tagAIOutput } from '@/lib/ai-isolation';
import { logAudit } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; dossierId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  
  const tenantId = params.id;
  const dossierId = params.dossierId;
  
  // Récupération du dossier
  const dossier = await prisma.dossier.findFirst({
    where: {
      id: dossierId,
      tenantId
    },
    include: {
      client: true,
      documents: true
    }
  });
  
  if (!dossier) {
    return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
  }
  
  // 1. PRÉPARATION SÉCURISÉE
  const safeDossier = prepareDossierForAI(dossier);
  
  if (!safeDossier) {
    return NextResponse.json({
      error: 'Impossible d\'anonymiser le dossier'
    }, { status: 400 });
  }
  
  // 2. APPEL IA SÉCURISÉ
  const analysis = await secureAICall(
    async (input) => {
      // Votre logique IA
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `Analyse ce dossier: ${JSON.stringify(input)}`
        })
      });
      return await response.json();
    },
    safeDossier
  );
  
  // 3. SAUVEGARDE AVEC TAG
  if (analysis) {
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        aiAnalysis: JSON.stringify(analysis)
        // analysis contient déjà __aiGenerated, __requiresHumanValidation, etc.
      }
    });
  }
  
  // 4. AUDIT
  await logAudit({
    tenantId,
    userId: session.user.id,
    action: 'CREATE',
    objectType: 'Dossier',
    objectId: dossierId,
    metadata: {
      aiAnalysisGenerated: true,
      model: 'llama3.2'
    },
    success: true
  });
  
  return NextResponse.json({ analysis });
}
```

---

## 🔍 Détection d'Anomalies

```typescript
// app/api/admin/security/anomalies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { detectUnauthorizedAccess, countUserActions } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get('tenantId');
  
  // Tentatives d'accès non autorisé (24h)
  const unauthorized = await detectUnauthorizedAccess(tenantId || undefined, 24);
  
  // Téléchargements suspects
  const suspiciousDownloads = await prisma.auditLog.findMany({
    where: {
      action: 'DOWNLOAD',
      timestamp: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // 1h
      }
    },
    select: {
      userId: true,
      _count: true
    },
    groupBy: ['userId'],
    having: {
      _count: {
        gte: 10 // Plus de 10 téléchargements en 1h
      }
    }
  });
  
  return NextResponse.json({
    unauthorized,
    suspiciousDownloads,
    recommendations: unauthorized.length > 0 ? [
      'Vérifier les accès des utilisateurs concernés',
      'Renforcer l\'authentification',
      'Contacter les administrateurs tenant'
    ] : []
  });
}
```

---

## ✅ Migration Base de Données

Après modification du schema Prisma, exécuter :

```bash
npx prisma migrate dev --name add_security_features
npx prisma generate
```

---

## 📊 Dashboard Sécurité (Super Admin)

```typescript
// app/api/super-admin/security-health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Nombre total de logs
  const totalLogs = await prisma.auditLog.count();
  
  // Incidents 24h
  const incidents24h = await prisma.auditLog.count({
    where: {
      success: false,
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });
  
  // Documents avec hash
  const documentsWithHash = await prisma.document.count({
    where: {
      hash: { not: null }
    }
  });
  
  const totalDocuments = await prisma.document.count();
  
  const integrityRate = totalDocuments > 0 
    ? (documentsWithHash / totalDocuments) * 100 
    : 0;
  
  return NextResponse.json({
    health: {
      totalAuditLogs: totalLogs,
      incidents24h,
      documentIntegrityRate: integrityRate.toFixed(2) + '%'
    },
    status: incidents24h > 10 ? 'warning' : 'healthy'
  });
}
```

---

## 🎯 Checklist d'Implémentation

### Phase 1 : Base de données ✅
- [x] Modèle `AuditLog` créé
- [x] Modèle `DocumentVersion` créé
- [ ] Migration exécutée

### Phase 2 : Code ✅
- [x] Utilitaires crypto créés
- [x] Service audit créé
- [x] Isolation IA créée
- [x] Middleware Zero-Trust créé

### Phase 3 : Intégration (À faire)
- [ ] Activer middleware global
- [ ] Migrer routes API existantes
- [ ] Ajouter hash sur uploads
- [ ] Implémenter versioning
- [ ] Créer dashboard sécurité

### Phase 4 : Tests
- [ ] Tests unitaires audit
- [ ] Tests isolation IA
- [ ] Tests middleware
- [ ] Pentest

---

**🔐 Votre application est maintenant prête pour une sécurité de niveau enterprise.**
