# 🔐 MemoLib - Stratégie Complète de Confidentialité & Sécurité
**Contexte:** Données hautement sensibles (dossiers juridiques, clients, stratégie légale)  
**Audience:** Avocat + Secrétaire + Partenaires  
**Date:** 01 avril 2026

---

## 🎯 Principes Fondamentaux

```
Confidentialité = Chiffrement + Accès Contrôlé + Audit Complet + Ségrégation
```

### Zero Trust Architecture
- ❌ Jamais de données en clair
- ❌ Jamais d'accès par défaut
- ✅ Chaque accès = authentification + autorisation + log
- ✅ Chiffrement par défaut

---

## 1️⃣ DONNÉES AU REPOS (Chiffrement)

### A. Base de Données - Chiffrement Transparent

**Implémentation actuelle:**
```typescript
// Prisma avec Field-Level Encryption
model Dossier {
  id        String   @id @default(cuid())
  titre     String   @encryption  // Chiffré AES-256 au repos
  description String @encryption
  documents Document[]
  createdAt DateTime @default(now())
}

// Middleware automatique: decrypt on read, encrypt on write
```

**À faire:**
```bash
# Installer Prisma-Encrypt
npm install prisma-encrypt

# Clé de chiffrement dans .env (HashiCorp Vault en prod)
DATABASE_ENCRYPTION_KEY=32-byte-base64-key-from-vault
```

**En Production (Azure):**
```typescript
// Azure SQL Server Transparent Data Encryption (TDE)
// + Azure Key Vault pour keywrap
// = Double chiffrement automatique
```

### B. Fichiers Documents - Chiffrement Client-Side + Serveur

**Flux Documents:**
```
Client (Avocat)
  ↓ [AES-256-GCM]
  ↓ (clé locale + clé serveur)
Server (Azure Blob Storage)
  ↓ [Azure Storage Encryption + Customer-Managed Keys]
  ↓
Vault (Archive froid)
```

**Implémentation:**
```typescript
// document.service.ts
async uploadDocument(file: File, dossierId: string): Promise<Document> {
  // 1. Générer une clé DEK (Data Encryption Key)
  const dek = crypto.getRandomValues(new Uint8Array(32));
  
  // 2. Chiffrer le fichier client-side
  const encrypted = await encryptFile(file, dek);
  
  // 3. Uploader vers Azure Blob (déjà chiffré)
  const blobUrl = await uploadToBlob(encrypted);
  
  // 4. Chiffrer la DEK avec KEK serveur (HSM)
  const encryptedDek = await encryptDekWithKek(dek);
  
  // 5. Stocker métadatas + DEK chiffré dans DB
  return prisma.document.create({
    data: {
      dossierId,
      blobUrl,
      encryptedDek,  // DEK chiffé avec KEK du serveur
      fileName: file.name,
      hash: sha256(file.buffer),  // Pour intégrité
    },
  });
}

async downloadDocument(docId: string): Promise<File> {
  // 1. Vérifier autorisation (RBAC + audit)
  await checkAccess(docId, currentUser);
  
  // 2. Récupérer le fichier chiffré
  const document = await prisma.document.findUnique({ where: { id: docId } });
  const encrypted = await downloadFromBlob(document.blobUrl);
  
  // 3. Déchiffrer la DEK
  const dek = await decryptDekWithKek(document.encryptedDek);
  
  // 4. Déchiffrer le fichier
  const decrypted = await decryptFile(encrypted, dek);
  
  // 5. Vérifier hash (intégrité)
  if (sha256(decrypted.buffer) !== document.hash) {
    throw new Error('Document tampered!');
  }
  
  // 6. Logger l'accès
  await auditLog({
    action: 'DOCUMENT_DOWNLOADED',
    docId,
    userId: currentUser.id,
    timestamp: new Date(),
    ipAddress: req.ip,
  });
  
  return decrypted;
}
```

---

## 2️⃣ DONNÉES EN TRANSIT (TLS + MutualTLS)

### A. Client ↔ Serveur

```yaml
# nginx.conf / reverse proxy
server {
  listen 443 ssl http2;
  
  # TLS 1.3 obligatoire
  ssl_protocols TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  
  # Certificat Let's Encrypt (auto-renew)
  ssl_certificate /etc/letsencrypt/live/memolib.fr/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/memolib.fr/privkey.pem;
  
  # HSTS pour forcer HTTPS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  
  # CSP pour bloquer injections
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-...'; style-src 'self'" always;
}
```

### B. Serveur ↔ Services Externes (mTLS)

```typescript
// Connexion à Azure Key Vault avec certificat client
const credential = new CertificateCredential(
  tenantId,
  clientId,
  certificatePath,  // /var/secrets/tls/client.pem
);

const client = new SecretClient(vaultUrl, credential);
const encryptionKey = await client.getSecret('memolib-encryption-key');
```

---

## 3️⃣ CONTRÔLE D'ACCÈS (RBAC + MFA)

### A. Authentification Multi-Facteur

```typescript
// nextauth.js
export const authOptions = {
  providers: [
    {
      id: 'azure-ad',
      name: 'Azure AD',
      type: 'oauth',
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: { params: { scope: 'openid profile email' } },
    },
  ],
  
  // Callback: après authentification
  callbacks: {
    async jwt({ token, account }) {
      // Vérifier MFA pour avocat
      if (await needsMFA(token.email)) {
        token.mfaPending = true;  // Redirect to MFA page
      }
      return token;
    },
    
    async session({ session, token }) {
      session.user.roles = await getUserRoles(token.sub);
      session.user.permissions = await getUserPermissions(token.sub);
      return session;
    },
  },
};

// POST /api/auth/mfa/verify
async function verifyMFA(code: string, userId: string) {
  const secret = await prisma.mfaSecret.findUnique({ where: { userId } });
  
  // TOTP verification (Authenticator app)
  if (!speakeasy.totp.verify({
    secret: secret.encrypted,
    encoding: 'base64',
    token: code,
    window: 2,
  })) {
    throw new Error('Invalid MFA code');
  }
  
  // Marquer session comme MFA-approved
  return {
    mfaApproved: true,
    sessionToken: generateSecureToken(),
  };
}
```

### B. RBAC Fine-Grained

```typescript
// roles.ts
const ROLES = {
  AVOCAT: {
    permissions: [
      'dossier:create',
      'dossier:read:own',
      'dossier:read:shared',
      'dossier:update:own',
      'dossier:delete:own',
      'document:upload',
      'document:sign',
      'document:archive',
      'audit:read:own',
      'user:invite',  // Inviter secrétaire/témoin
      'client:manage',
    ],
  },
  
  SECRETAIRE: {
    permissions: [
      'dossier:read:own',
      'dossier:update:own',  // Pas delete
      'document:upload',
      'document:read',
      'audit:read:own',
      // PAS d'accès: signer, archiver, supprimer
    ],
  },
  
  TEMOIN: {
    permissions: [
      'dossier:read:shared',
      'document:read:shared',
      'comment:create',
      // Très limité
    ],
  },
};

// Middleware API: vérifier permission avant endpoint
async function checkPermission(req, res, next) {
  const user = req.session.user;
  const resource = req.params.dossierId;
  const action = `${req.method.toLowerCase()}:${resource}`;
  
  const hasPermission = await prisma.permission.findFirst({
    where: {
      userId: user.id,
      action,
      expiresAt: { gt: new Date() },
    },
  });
  
  if (!hasPermission) {
    auditLog({ action: 'UNAUTHORIZED_ACCESS_ATTEMPT', userId: user.id });
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}
```

---

## 4️⃣ AUDIT & COMPLIANCE (Immuable)

### A. Audit Trail Inviolable

```typescript
// prisma.schema
model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // 'DOCUMENT_VIEWED', 'DOSSIER_CREATED', etc.
  resource  String   // 'dossier:xyz123'
  status    String   // 'SUCCESS', 'DENIED', etc.
  
  // Context
  ipAddress String
  userAgent String
  
  // Immutabilité
  hash      String   @unique  // SHA-256 du log + clé
  prevHash  String?          // Chaîne blockchain
  
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
}
```

```typescript
// audit.service.ts
async function logAccess(event: AuditEvent) {
  const previousLog = await getLastAuditLog();
  const prevHash = previousLog?.hash || 'genesis';
  
  // Calculer hash avec chaîne
  const dataToHash = JSON.stringify({
    ...event,
    prevHash,
  });
  const hash = sha256(dataToHash);
  
  // Signer avec clé privée pour certification
  const signature = sign(hash, privKey);
  
  return prisma.auditLog.create({
    data: {
      ...event,
      hash,
      signature,
      prevHash,
    },
  });
}

// Vérifier intégrité audit trail
async function verifyAuditChain() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
  });
  
  let prevHash = 'genesis';
  for (const log of logs) {
    const dataToHash = JSON.stringify({
      ...log,
      prevHash,
    });
    const expectedHash = sha256(dataToHash);
    
    if (expectedHash !== log.hash) {
      throw new Error(`Audit log tampered at ${log.id}`);
    }
    
    prevHash = log.hash;
  }
  
  return true;  // Pas de tampering détecté
}
```

### B. Dashboard Audit pour Avocat

```typescript
// GET /api/dossiers/:id/audit
async function getDossierAudit(dossierId: string) {
  return prisma.auditLog.findMany({
    where: {
      resource: `dossier:${dossierId}`,
    },
    select: {
      action: true,
      userId: true,
      status: true,
      createdAt: true,
      ipAddress: true,
      // PAS: signature, prevHash (données technique)
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## 5️⃣ SÉPARATION DONNÉES: Production vs Benchmark vs Demo

### A. Trois Environnements Complètement Isolés

```
memolib-prod (données réelles avocat)
├── Database: Azure SQL (chiffré TDE + CMK)
├── Storage: Azure Blob (customer-managed keys)
├── Secrets: Azure Key Vault (HSM)
└── Access: VPN + IP whitelist + MFA obligatoire

memolib-staging (test avant prod)
├── Database: Azure SQL (test data only)
├── ANONYMIZED: Tous les noms → "Client ABC", "Dossier DEF"
├── Limited retention: 7 jours max
└── Access: Équipe dev + partenaires

memolib-demo (pour démo / benchmarks publics)
├── Database: SYNTHÉTIQUE (generated data)
├── Documents: Sample PDFs (non-confidentiels)
├── Read-only: Aucune modification possible
└── Public: Accessible sans auth (mais rate-limited)
```

**Implémentation:**
```typescript
// config/environment.ts
export const ENVIRONMENTS = {
  production: {
    dbUrl: process.env.PROD_DATABASE_URL,
    blobContainer: 'memolib-prod-docs',
    keyVault: 'memolib-prod-kv',
    dataPolicy: 'REAL_DATA_ENCRYPTED',
    retention: 'FOREVER',
    backupFrequency: 'HOURLY',
  },
  
  staging: {
    dbUrl: process.env.STAGING_DATABASE_URL,
    blobContainer: 'memolib-staging-docs',
    keyVault: 'memolib-staging-kv',
    dataPolicy: 'ANONYMIZED_ONLY',
    retention: '7_DAYS',
    backupFrequency: 'DAILY',
  },
  
  demo: {
    dbUrl: process.env.DEMO_DATABASE_URL,
    blobContainer: 'memolib-demo-docs',
    keyVault: null,  // PAS de vraie crypto
    dataPolicy: 'SYNTHETIC_DATA_ONLY',
    retention: 'PERSISTENT',
    backupFrequency: 'WEEKLY',
  },
};

// Middleware: refuser accès prod data en non-prod
function checkDataPolicy(req, res, next) {
  const env = process.env.NODE_ENV;
  const resource = req.params.dossierId;
  
  // En demo: interdire les endpoints sensibles
  if (env === 'demo' && ['sign', 'archive', 'delete'].includes(req.params.action)) {
    return res.status(403).json({ 
      error: 'This action is unavailable in demo mode',
      reason: 'Demo data is read-only for confidentiality',
    });
  }
  
  next();
}
```

### B. Data Anonymization Pipeline (Staging)

```bash
#!/bin/bash
# scripts/anonymize-staging.sh

# Copier prod → staging (chiffré)
pg_dump memolib_prod | \
  gzip | \
  gpg --symmetric --cipher-algo AES256 > backup.sql.gz.gpg

# Envoyer à staging (sécurisé)
scp -i ~/.ssh/id_rsa backup.sql.gz.gpg staging-server:/tmp/

# Anonymiser IN PLACE
psql memolib_staging << EOF
  UPDATE Dossier 
  SET titre = CONCAT('Dossier ', id),
      description = 'Confidential legal matter'
  WHERE createdAt > NOW() - INTERVAL '7 days';
  
  UPDATE Client
  SET 
    name = CONCAT('Client ', id),
    email = CONCAT('client-', id, '@example.com'),
    phone = '0123456789'
  WHERE createdAt > NOW() - INTERVAL '7 days';
  
  UPDATE Document
  SET fileName = CONCAT('Document_', id, '.pdf')
  WHERE createdAt > NOW() - INTERVAL '7 days';
EOF

# Purger après 7 jours
DELETE FROM AuditLog WHERE createdAt < NOW() - INTERVAL '7 days';
DELETE FROM Document WHERE createdAt < NOW() - INTERVAL '7 days';
```

---

## 6️⃣ MCP SERVER - Sécurité Spécifique

**Problème:** MCP expose les dossiers à Claude (LLM tiers)

**Solution 1: Proxy Sécurisé MCP**
```typescript
// mcp-server/secure-proxy.ts
class SecureMcpProxy {
  async toolDossier_read(dossierId: string) {
    // 1. Vérifier que c'est une démo/synthétique
    const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('❌ MCP access forbidden in production');
    }
    
    if (!dossier.isDemo) {
      throw new Error('❌ Can only access DEMO dossiers via MCP');
    }
    
    // 2. Redacter les infos sensibles
    return {
      titre: dossier.titre,
      type: dossier.type,
      status: dossier.statut,
      // PAS de: clientSecrets, strategyNotes, etc.
    };
  }
}
```

**Solution 2: Audit MCP Calls**
```typescript
// Chaque appel à MCP est loggé
app.post('/mcp/tool', async (req, res) => {
  const call = {
    toolName: req.body.tool,
    input: req.body.input,
    aiModel: req.headers['user-agent'],  // Claude, GPT-4, etc.
  };
  
  await auditLog({
    action: 'MCP_TOOL_CALLED',
    resource: `mcp:${call.toolName}`,
    context: call,
    ipAddress: req.ip,
  });
  
  // Exécuter l'outil
  const result = await executeTool(call);
  res.json(result);
});
```

---

## 7️⃣ CHECKLIST CONFIDENTIALITÉ

### Avant Démo à l'Avocat
- [ ] ✅ Vérifier `NODE_ENV === 'production'` en prod
- [ ] ✅ Tout utilisateur a MFA activée
- [ ] ✅ Audit trail de 6 mois visible dans dashboard
- [ ] ✅ Certificats TLS valides (pas auto-signé)
- [ ] ✅ Tous les secrets dans Azure Key Vault (pas en `.env`)
- [ ] ✅ Databases chiffés (TDE enabled)
- [ ] ✅ Backups testés (restore test OK)

### Avant Publication Benchmark Public
- [ ] ✅ Données 100% synthetic (aucune vraie donnée)
- [ ] ✅ Credentials testées en isolation
- [ ] ✅ Rate limiting (max 10 req/min/IP)
- [ ] ✅ Read-only mode forcé
- [ ] ✅ Aucun document réel téléchargeable
- [ ] ✅ Legal disclaimer: "This is demo data only"

### Avant Présentation Partenaires
- [ ] ✅ Staging environment isolée
- [ ] ✅ Données anonymisées (noms génériques)
- [ ] ✅ Screenshots sans infos sensibles
- [ ] ✅ Secrétaire/témoin test accounts créés
- [ ] ✅ Auto-delete après 24h des données
- [ ] ✅ NDA signé par participants

---

## 8️⃣ MONITORING CONTINU

```typescript
// Alertes de sécurité
export const securityAlerts = {
  FAILED_AUTH_3X: {
    trigger: 'Si 3 tentatives échouées en 5 min',
    action: 'Bloquer IP + notification',
  },
  
  UNUSUAL_ACCESS: {
    trigger: 'Accès late-night (2-4 AM) ou de pays interdit',
    action: 'Demander MFA again + audit log',
  },
  
  BULK_DOWNLOAD: {
    trigger: 'Si >100 documents télé en <1 min',
    action: 'Bloquer session + investigation',
  },
  
  CERT_EXPIRING: {
    trigger: 'Si TLS cert expire en <7 jours',
    action: 'Auto-renew + notification ops',
  },
  
  AUDIT_CHAIN_BROKEN: {
    trigger: 'Si hash audit trail invalide',
    action: 'Alert critique + investigation légale',
  },
};
```

---

## 📋 Résumé: Garanties de Confidentialité

| Aspect | Garantie | Implémentation |
|--------|----------|--------|
| **Données au repos** | AES-256 + TDE | Prisma-Encrypt + Azure TDE |
| **Données en transit** | TLS 1.3 + mTLS | nginx + cert client |
| **Accès** | MFA + RBAC | Azure AD + custom permissions |
| **Audit** | Immuable + signé | Hash chain + cryptographie |
| **Séparation** | Prod ≠ Staging ≠ Demo | 3 databases isolées |
| **Chiffrement docs** | Client-side + serveur | AES + Azure Blob CMK |
| **Rétention** | Conforme RGPD | Auto-delete + soft-delete |

---

**Niveau de sécurité:** 🔔 **ENTREPRISE / AVOCATS** (Level 4/5)
- Comparable à systèmes bancaires
- Suffisant pour données juridiques confidentielles
- Conforme RGPD + NDA

---

*Pour validation finale: faire audit de sécurité externe (Cure53, Deloitte, etc.)*
