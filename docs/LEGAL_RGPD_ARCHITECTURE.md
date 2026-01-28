# ⚖️ ARCHITECTURE LÉGALE & RGPD — Cabinet d'Avocats

> **Conformité totale** — Secret professionnel, RGPD, déontologie avocat

---

## 🎯 OBLIGATIONS LÉGALES SPÉCIFIQUES

### 1. Secret Professionnel (Art. 66-5 Loi 1971)

**Principe :** Absolu, général, illimité dans le temps

**Implémentation technique :**

```typescript
// src/lib/security/professional-secrecy.ts

export class ProfessionalSecrecyGuard {
  
  // Chiffrement E2E obligatoire
  async encryptSensitiveData(data: string, clientId: string): Promise<string> {
    const key = await this.getClientKey(clientId); // Clé unique par client
    return crypto.encrypt(data, key, 'AES-256-GCM');
  }
  
  // Isolation stricte par tenant
  async enforceDataIsolation(query: any, tenantId: string): Promise<void> {
    if (!query.where) query.where = {};
    query.where.tenantId = tenantId; // Forcé, jamais optionnel
  }
  
  // Audit trail immutable
  async logAccess(userId: string, resourceId: string, action: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        resourceId,
        action,
        timestamp: new Date(),
        hash: this.computeHash(userId, resourceId, action),
        previousHash: await this.getLastHash(),
      }
    });
  }
}
```

---

### 2. RGPD (Règlement 2016/679)

#### Bases légales applicables

| Traitement | Base légale | Durée conservation |
|------------|-------------|-------------------|
| Gestion dossier client | Contrat (Art. 6.1.b) | 5 ans après clôture |
| Communications | Intérêt légitime (Art. 6.1.f) | Durée du mandat |
| Facturation | Obligation légale (Art. 6.1.c) | 10 ans (Code commerce) |
| Marketing | Consentement (Art. 6.1.a) | Jusqu'à retrait |

#### Implémentation

```typescript
// src/lib/rgpd/consent-manager.ts

export class ConsentManager {
  
  // Enregistrer consentement explicite
  async recordConsent(data: {
    clientId: string;
    purpose: 'CONTRACT' | 'LEGITIMATE_INTEREST' | 'LEGAL_OBLIGATION' | 'CONSENT';
    channel: ChannelType;
    granted: boolean;
    evidence: string; // Preuve du consentement
  }): Promise<void> {
    await prisma.consent.create({
      data: {
        ...data,
        grantedAt: new Date(),
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent(),
        expiresAt: this.calculateExpiry(data.purpose),
      }
    });
  }
  
  // Droit d'accès (Art. 15)
  async exportClientData(clientId: string): Promise<RGPDExport> {
    const [client, messages, documents, consents, auditLogs] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.channelMessage.findMany({ where: { clientId } }),
      prisma.document.findMany({ where: { clientId } }),
      prisma.consent.findMany({ where: { clientId } }),
      prisma.auditLog.findMany({ where: { resourceId: clientId } }),
    ]);
    
    return {
      exportDate: new Date(),
      client,
      messages,
      documents,
      consents,
      auditLogs: auditLogs.map(log => ({
        ...log,
        hash: undefined, // Masquer hash technique
      })),
    };
  }
  
  // Droit à l'oubli (Art. 17)
  async deleteClientData(clientId: string, reason: string): Promise<void> {
    // 1. Vérifier si suppression autorisée
    const hasActiveDossier = await prisma.dossier.count({
      where: { clientId, status: { in: ['OPEN', 'IN_PROGRESS'] } }
    });
    
    if (hasActiveDossier > 0) {
      throw new Error('Suppression impossible : dossiers actifs');
    }
    
    // 2. Anonymiser (pas supprimer) pour conservation légale
    await prisma.$transaction([
      prisma.client.update({
        where: { id: clientId },
        data: {
          email: `deleted-${clientId}@anonymized.local`,
          phone: null,
          name: 'Client supprimé',
          deletedAt: new Date(),
          deletionReason: reason,
        }
      }),
      prisma.channelMessage.updateMany({
        where: { clientId },
        data: {
          senderData: { anonymized: true },
          body: '[Contenu supprimé - RGPD]',
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'CLIENT_DATA_DELETED',
          resourceId: clientId,
          details: { reason },
        }
      }),
    ]);
  }
}
```

---

### 3. Déontologie Avocat (RIN)

#### Règles applicables

**Art. 4.1 — Indépendance**
- ❌ Pas d'IA qui prend des décisions juridiques
- ✅ IA = assistant, avocat = décideur

**Art. 4.3 — Compétence**
- ❌ Pas de promesse de résultat
- ✅ Obligation de moyens uniquement

**Art. 4.4 — Confraternité**
- ❌ Pas de dénigrement confrères
- ✅ Respect secret professionnel confrères

#### Implémentation

```typescript
// src/lib/legal/deontology-guard.ts

export class DeontologyGuard {
  
  // Interdire promesses de résultat
  async validateCommunication(message: string): Promise<ValidationResult> {
    const forbiddenPatterns = [
      /garantir? (le|la|votre) (gain|victoire|succès)/i,
      /vous gagnerez/i,
      /résultat assuré/i,
      /100% de réussite/i,
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(message)) {
        return {
          valid: false,
          reason: 'Promesse de résultat interdite (Art. 4.3 RIN)',
          suggestion: 'Reformuler en obligation de moyens',
        };
      }
    }
    
    return { valid: true };
  }
  
  // Marquer contenu généré par IA
  async markAIGenerated(content: string): Promise<string> {
    return `${content}\n\n---\n⚠️ Ce contenu a été généré par IA et doit être validé par un avocat.`;
  }
  
  // Bloquer décisions automatiques
  async requireHumanValidation(action: string): Promise<void> {
    const criticalActions = [
      'SEND_LEGAL_ADVICE',
      'SIGN_DOCUMENT',
      'ACCEPT_MANDATE',
      'CLOSE_DOSSIER',
    ];
    
    if (criticalActions.includes(action)) {
      throw new Error('Action critique : validation avocat obligatoire');
    }
  }
}
```

---

## 🔐 ARCHITECTURE SÉCURITÉ

### Chiffrement multi-niveaux

```typescript
// src/lib/security/encryption.ts

export class EncryptionService {
  
  // Niveau 1 : Chiffrement base de données (TDE)
  // → Géré par PostgreSQL
  
  // Niveau 2 : Chiffrement colonne (données sensibles)
  async encryptColumn(data: string): Promise<string> {
    const key = process.env.COLUMN_ENCRYPTION_KEY!;
    return crypto.encrypt(data, key, 'AES-256-GCM');
  }
  
  // Niveau 3 : Chiffrement E2E (documents)
  async encryptDocument(file: Buffer, clientId: string): Promise<Buffer> {
    const clientKey = await this.getClientKey(clientId);
    return crypto.encrypt(file, clientKey, 'AES-256-GCM');
  }
  
  // Clé unique par client (stockée dans Key Vault)
  private async getClientKey(clientId: string): Promise<string> {
    const keyName = `client-${clientId}-key`;
    return await azureKeyVault.getSecret(keyName);
  }
}
```

---

### Isolation multi-tenant

```typescript
// src/middleware/tenant-isolation.ts

export async function tenantIsolationMiddleware(req: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  
  // Injecter tenantId dans toutes les requêtes
  req.headers.set('x-tenant-id', session.user.tenantId);
  
  // Vérifier isolation
  const requestedTenantId = req.nextUrl.searchParams.get('tenantId');
  if (requestedTenantId && requestedTenantId !== session.user.tenantId) {
    await auditService.log({
      action: 'TENANT_ISOLATION_VIOLATION',
      userId: session.user.id,
      details: { requestedTenantId, actualTenantId: session.user.tenantId },
      severity: 'CRITICAL',
    });
    return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
  }
  
  return NextResponse.next();
}
```

---

## 📋 REGISTRE DES TRAITEMENTS (Art. 30 RGPD)

```typescript
// prisma/schema.prisma

model DataProcessingRegistry {
  id                String   @id @default(uuid())
  name              String   // "Gestion dossiers clients"
  purpose           String   // "Exécution contrat avocat-client"
  legalBasis        String   // "CONTRACT" | "LEGITIMATE_INTEREST" | ...
  dataCategories    String[] // ["Identité", "Coordonnées", "Données judiciaires"]
  recipients        String[] // ["Avocat", "Greffier", "Expert"]
  retentionPeriod   String   // "5 ans après clôture"
  securityMeasures  String[] // ["Chiffrement", "Contrôle accès", "Audit trail"]
  dpia              Boolean  // Analyse d'impact obligatoire ?
  crossBorderTransfer Boolean
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## 🛡️ MESURES TECHNIQUES

### 1. Contrôle d'accès (RBAC)

```typescript
// src/lib/security/rbac.ts

export const ROLES = {
  AVOCAT: {
    permissions: [
      'READ_ALL_DOSSIERS',
      'WRITE_ALL_DOSSIERS',
      'READ_CLIENT_DATA',
      'WRITE_CLIENT_DATA',
      'SEND_MESSAGES',
      'VALIDATE_AI_CONTENT',
    ]
  },
  COLLABORATEUR: {
    permissions: [
      'READ_ASSIGNED_DOSSIERS',
      'WRITE_ASSIGNED_DOSSIERS',
      'READ_CLIENT_DATA',
      'SEND_MESSAGES',
    ]
  },
  SECRETAIRE: {
    permissions: [
      'READ_ASSIGNED_DOSSIERS',
      'SEND_MESSAGES',
      'UPLOAD_DOCUMENTS',
    ]
  },
  CLIENT: {
    permissions: [
      'READ_OWN_DOSSIERS',
      'SEND_MESSAGES',
      'UPLOAD_DOCUMENTS',
      'DOWNLOAD_OWN_DOCUMENTS',
    ]
  },
};

export async function checkPermission(
  userId: string,
  permission: string,
  resourceId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });
  
  if (!user) return false;
  
  // Vérifier permission globale
  if (!ROLES[user.role.name]?.permissions.includes(permission)) {
    return false;
  }
  
  // Vérifier permission sur ressource spécifique
  if (resourceId) {
    const hasAccess = await prisma.dossierAccess.count({
      where: { userId, dossierId: resourceId }
    });
    return hasAccess > 0;
  }
  
  return true;
}
```

---

### 2. Audit trail immutable

```typescript
// src/lib/security/audit-trail.ts

export class AuditTrail {
  
  async log(entry: {
    action: string;
    userId: string;
    resourceType: string;
    resourceId: string;
    details?: any;
  }): Promise<void> {
    const previousHash = await this.getLastHash();
    const currentHash = this.computeHash({
      ...entry,
      timestamp: new Date(),
      previousHash,
    });
    
    await prisma.auditLog.create({
      data: {
        ...entry,
        timestamp: new Date(),
        hash: currentHash,
        previousHash,
      }
    });
  }
  
  // Vérifier intégrité chaîne
  async verifyIntegrity(): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'asc' }
    });
    
    for (let i = 1; i < logs.length; i++) {
      const expectedHash = this.computeHash({
        ...logs[i],
        previousHash: logs[i-1].hash,
      });
      
      if (logs[i].hash !== expectedHash) {
        await this.alertTampering(logs[i]);
        return false;
      }
    }
    
    return true;
  }
  
  private computeHash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

---

## 📄 DOCUMENTS OBLIGATOIRES

### 1. Politique de confidentialité

```markdown
# POLITIQUE DE CONFIDENTIALITÉ

## 1. Responsable de traitement
[Nom du cabinet]
[Adresse]
DPO : [email]

## 2. Données collectées
- Identité (nom, prénom)
- Coordonnées (email, téléphone, adresse)
- Données judiciaires (dossiers, procédures)
- Communications (emails, messages, appels)

## 3. Finalités
- Exécution du contrat avocat-client
- Gestion des dossiers
- Communication avec le client
- Facturation

## 4. Base légale
- Contrat (Art. 6.1.b RGPD)
- Obligation légale (Art. 6.1.c RGPD)
- Intérêt légitime (Art. 6.1.f RGPD)

## 5. Durée de conservation
- Dossiers : 5 ans après clôture
- Factures : 10 ans
- Communications : Durée du mandat

## 6. Vos droits
- Droit d'accès (Art. 15)
- Droit de rectification (Art. 16)
- Droit à l'effacement (Art. 17)
- Droit à la portabilité (Art. 20)
- Droit d'opposition (Art. 21)

Contact DPO : dpo@cabinet.com
```

---

### 2. Mentions légales

```typescript
// src/app/mentions-legales/page.tsx

export default function MentionsLegales() {
  return (
    <div>
      <h1>Mentions Légales</h1>
      
      <h2>Éditeur</h2>
      <p>[Nom du cabinet]</p>
      <p>Barreau de [Ville]</p>
      <p>N° SIRET : [...]</p>
      
      <h2>Directeur de publication</h2>
      <p>[Nom de l'avocat]</p>
      
      <h2>Hébergement</h2>
      <p>Vercel Inc.</p>
      <p>340 S Lemon Ave #4133, Walnut, CA 91789</p>
      
      <h2>Règles professionnelles</h2>
      <p>Règlement Intérieur National (RIN)</p>
      <p>Code de déontologie des avocats</p>
      
      <h2>Assurance</h2>
      <p>Responsabilité civile professionnelle</p>
      <p>[Nom assureur]</p>
      <p>Couverture géographique : [...]</p>
    </div>
  );
}
```

---

## 🚨 GESTION DES INCIDENTS

```typescript
// src/lib/security/incident-response.ts

export class IncidentResponse {
  
  async detectBreach(): Promise<void> {
    // Détection automatique
    const indicators = await this.checkIndicators();
    
    if (indicators.severity === 'HIGH' || indicators.severity === 'CRITICAL') {
      await this.triggerIncidentProcedure(indicators);
    }
  }
  
  async triggerIncidentProcedure(incident: Incident): Promise<void> {
    // 1. Notification immédiate DPO
    await this.notifyDPO(incident);
    
    // 2. Containment
    await this.containThreat(incident);
    
    // 3. Investigation
    const analysis = await this.investigate(incident);
    
    // 4. Notification CNIL (72h si données sensibles)
    if (this.requiresCNILNotification(analysis)) {
      await this.notifyCNIL(analysis);
    }
    
    // 5. Notification clients concernés
    if (this.requiresClientNotification(analysis)) {
      await this.notifyAffectedClients(analysis);
    }
    
    // 6. Documentation
    await this.documentIncident(analysis);
  }
  
  private requiresCNILNotification(analysis: Analysis): boolean {
    return (
      analysis.affectedRecords > 0 &&
      (analysis.dataTypes.includes('JUDICIAL') ||
       analysis.dataTypes.includes('HEALTH') ||
       analysis.severity === 'HIGH')
    );
  }
}
```

---

## ✅ CHECKLIST CONFORMITÉ

### Avant mise en production

- [ ] Politique de confidentialité publiée
- [ ] Mentions légales complètes
- [ ] CGU/CGV validées par avocat
- [ ] Registre des traitements à jour
- [ ] DPIA réalisée (si nécessaire)
- [ ] Contrat sous-traitant (Vercel, Azure)
- [ ] Chiffrement E2E activé
- [ ] Audit trail fonctionnel
- [ ] Isolation multi-tenant testée
- [ ] Procédure incident documentée
- [ ] Formation équipe RGPD
- [ ] DPO désigné (si > 250 salariés)

### Maintenance continue

- [ ] Revue trimestrielle registre
- [ ] Test annuel procédure incident
- [ ] Audit sécurité annuel
- [ ] Mise à jour politique confidentialité
- [ ] Vérification intégrité audit trail
- [ ] Revue droits d'accès
- [ ] Purge données expirées

---

## 📞 CONTACTS UTILES

- **CNIL** : 01 53 73 22 22 | www.cnil.fr
- **Ordre des Avocats** : [Barreau local]
- **DPO Cabinet** : dpo@cabinet.com
- **Support technique** : support@memoLib.com
