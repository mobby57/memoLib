# 🗄️ MODÈLE DE DONNÉES FINAL — WORKSPACE JURIDIQUE

**Version fondatrice — Figée et opposable**

---

## 📋 PRINCIPES DIRECTEURS

### 1. Neutralité absolue
Chaque donnée est **factuelle**, **horodatée**, **traçable**.

### 2. Inviolabilité
Les logs, preuves et transitions de statut sont **immuables**.

### 3. Auditabilité native
Chaque action est **journalisée** avec hash cryptographique.

### 4. Séparation stricte
- **Fait** ≠ **Interprétation**
- **Alerte** ≠ **Décision**
- **Documentation** ≠ **Conseil**

### 5. RGPD by design
Minimisation, consentement, droit à l'oubli, portabilité.

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU PLATEFORME                         │
│  Plan → Tenant → Subscription → TenantSettings              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU UTILISATEURS                       │
│  User (Admin/Collaborateur/Client)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU OPÉRATIONNEL                       │
│  Client → Dossier → Document → Email                        │
│  Facture → Paiement → CalendarEvent                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU JURIDIQUE                          │
│  LegalDeadline → LegalReference → Proof                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    NIVEAU TRAÇABILITÉ                        │
│  InformationUnit → AuditLog → ArchivePolicy                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 ENTITÉS CRITIQUES (DÉTAIL)

### 1️⃣ **InformationUnit** — Zéro information perdue

**Raison d'être** : Capturer TOUTE information entrante, quelle que soit sa source.

```prisma
model InformationUnit {
  id              String   @id @default(uuid())
  tenantId        String
  
  source          InformationUnitSource  // EMAIL, UPLOAD, API, MANUAL, SCAN, FAX
  content         String                 // Contenu brut
  contentHash     String   @unique       // SHA-256 pour déduplication
  
  currentStatus   InformationUnitStatus  // RECEIVED → CLASSIFIED → ANALYZED → RESOLVED
  
  sourceMetadata  String?  // JSON : {from, to, date, subject, etc.}
  linkedWorkspaceId String?
  metadata        String?  // JSON : tags, catégorie, etc.
  
  lastStatusChangeBy String?
  lastStatusChangeAt DateTime?
  
  receivedAt      DateTime @default(now())
  classifiedAt    DateTime?
  analyzedAt      DateTime?
  resolvedAt      DateTime?
  closedAt        DateTime?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  statusHistory   InformationStatusHistory[]
  proofs          Proof[]
}
```

**Statuts possibles** :
- `RECEIVED` : Information reçue, non traitée
- `CLASSIFIED` : Catégorisée (client, dossier, type)
- `ANALYZED` : Analysée par IA ou humain
- `INCOMPLETE` : Manque des éléments
- `AMBIGUOUS` : Nécessite clarification
- `HUMAN_ACTION_REQUIRED` : Escalade obligatoire
- `RESOLVED` : Traitée complètement
- `CLOSED` : Archivée

**Règles métier** :
- Toute information reçue = 1 InformationUnit
- Aucune suppression possible (soft delete uniquement)
- Hash unique empêche les doublons
- Transition de statut = trace immuable

---

### 2️⃣ **LegalDeadline** — Zéro délai raté

**Raison d'être** : Garantir le respect des délais légaux CESEDA.

```prisma
model LegalDeadline {
  id              String   @id @default(uuid())
  tenantId        String
  
  dossierId       String
  clientId        String
  
  type            DeadlineType  // RECOURS_GRACIEUX, RECOURS_CONTENTIEUX, APPEL, etc.
  label           String
  description     String?
  
  referenceDate   DateTime      // Date de notification/décision
  dueDate         DateTime      // Date limite calculée
  
  status          DeadlineStatus @default(PENDING)
  
  legalBasis      String?       // Ex: "L511-1 CESEDA"
  legalDays       Int?          // Nombre de jours légaux
  
  alertJ7Sent     Boolean @default(false)
  alertJ3Sent     Boolean @default(false)
  alertJ1Sent     Boolean @default(false)
  
  completedAt     DateTime?
  completedBy     String?
  completionNote  String?
  
  proofId         String?       // Lien vers Proof
  
  createdBy       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  alerts          DeadlineAlert[]
}
```

**Types de délais** :
- `RECOURS_GRACIEUX` : 2 mois
- `RECOURS_HIERARCHIQUE` : 2 mois
- `RECOURS_CONTENTIEUX` : 2 mois (TA)
- `APPEL` : 1 mois (CAA)
- `CASSATION` : 2 mois (CE)
- `OQTF` : 30/90 jours
- `RETENTION` : 48h/28j/45j/90j
- `CUSTOM` : Personnalisé

**Statuts** :
- `PENDING` : En attente
- `APPROACHING` : J-7
- `URGENT` : J-3
- `CRITICAL` : J-1
- `OVERDUE` : Dépassé
- `COMPLETED` : Respecté
- `CANCELLED` : Annulé

**Règles métier** :
- Calcul automatique selon CESEDA
- Alertes progressives (J-7, J-3, J-1)
- Preuve d'alerte envoyée (DeadlineAlert)
- Preuve de respect du délai (Proof)

---

### 3️⃣ **Proof** — Preuve opposable

**Raison d'être** : Documenter factuellement chaque acte.

```prisma
model Proof {
  id                String   @id @default(uuid())
  tenantId          String
  
  type              ProofType
  title             String
  description       String?
  
  dossierId         String?
  clientId          String?
  documentId        String?
  informationUnitId String?
  
  fileStorageKey    String?
  fileHash          String?   // SHA-256 du fichier
  fileMimeType      String?
  fileSize          Int?
  
  proofDate         DateTime  // Date de la preuve
  capturedAt        DateTime @default(now())
  capturedBy        String
  
  status            ProofStatus @default(PENDING_VALIDATION)
  validatedBy       String?
  validatedAt       DateTime?
  rejectionReason   String?
  
  timestampHash     String?   // Preuve d'intégrité
  chainPreviousId   String?   // Blockchain interne
  
  metadata          String?   // JSON
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**Types de preuves** :
- `DOCUMENT_RECEPTION` : AR postal/email
- `DOCUMENT_ENVOI` : Preuve d'envoi
- `ACCUSE_RECEPTION` : AR administratif
- `DEPOT_RECOURS` : Preuve de dépôt
- `NOTIFICATION_DECISION` : Notification officielle
- `AUDIENCE_PRESENCE` : Présence à l'audience
- `SIGNATURE_ELECTRONIQUE` : Signature certifiée
- `HORODATAGE_CERTIFIE` : Timestamp officiel
- `CAPTURE_EMAIL` : Email archivé
- `SCREENSHOT` : Capture d'écran
- `RAPPORT_IA` : Analyse IA
- `AUTRE` : Autre preuve

**Règles métier** :
- Hash SHA-256 du fichier
- Chaîne de blocs interne (chainPreviousId)
- Validation humaine obligatoire
- Immuable une fois validée

---

### 4️⃣ **AuditLog** — Journal inviolable

**Raison d'être** : Tracer TOUTE action sur la plateforme.

```prisma
model AuditLog {
  id            String   @id @default(uuid())
  tenantId      String
  
  userId        String
  userEmail     String
  userRole      String
  
  action        AuditAction  // CREATE, READ, UPDATE, DELETE, etc.
  entityType    String       // Dossier, Client, Document, etc.
  entityId      String
  
  oldValue      String?      // JSON - avant
  newValue      String?      // JSON - après
  
  ipAddress     String?
  userAgent     String?
  
  timestamp     DateTime @default(now())
  timestampHash String?      // SHA-256(action + entityId + timestamp + previousHash)
  previousLogId String?      // Chaîne de blocs
  
  createdAt     DateTime @default(now())
}
```

**Actions auditées** :
- `CREATE` : Création
- `READ` : Consultation
- `UPDATE` : Modification
- `DELETE` : Suppression
- `LOGIN` : Connexion
- `LOGOUT` : Déconnexion
- `EXPORT` : Export de données
- `IMPORT` : Import de données
- `APPROVE` : Validation
- `REJECT` : Rejet
- `ESCALATE` : Escalade
- `ARCHIVE` : Archivage

**Règles métier** :
- Immuable (aucune modification possible)
- Hash cryptographique (SHA-256)
- Chaîne de blocs interne
- Conservé 10 ans minimum

---

### 5️⃣ **LegalReference** — Base normative

**Raison d'être** : Rattacher chaque action à une norme.

```prisma
model LegalReference {
  id        String   @id @default(uuid())
  
  code      String   // CESEDA, Code Civil, CGCT, etc.
  article   String   // L313-11, R311-2, etc.
  version   String?  // Version en vigueur
  
  title     String
  content   String   // Texte de l'article
  summary   String?  // Résumé IA
  
  category  String   // titre_sejour, recours, asile, eloignement, etc.
  keywords  String?  // JSON array
  
  defaultDeadlineDays Int?
  deadlineType        String?  // franc, calendaire, ouvré
  
  legifrance_url String?
  eurlex_url     String?
  
  isActive  Boolean  @default(true)
  validFrom DateTime?
  validUntil DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Règles métier** :
- Synchronisation Légifrance (API)
- Versionning des articles
- Calcul automatique des délais
- Indexation full-text

---

### 6️⃣ **ArchivePolicy** — RGPD by design

**Raison d'être** : Respecter les obligations de conservation et suppression.

```prisma
model ArchivePolicy {
  id        String   @id @default(uuid())
  tenantId  String
  
  entityType String   // Dossier, Client, Document, etc.
  entityId   String
  
  status     ArchiveStatus @default(ACTIVE)
  
  retentionDays    Int       // Durée de conservation
  retentionReason  String?   // Obligation légale, contrat, etc.
  
  lastAccessAt     DateTime?
  archiveAt        DateTime?  // Date prévue d'archivage
  deleteAt         DateTime?  // Date prévue de suppression
  
  archivedAt       DateTime?
  archivedBy       String?
  deletedAt        DateTime?
  deletedBy        String?
  
  holdUntil        DateTime?  // Gel juridique
  holdReason       String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Statuts** :
- `ACTIVE` : En cours d'utilisation
- `PENDING_ARCHIVE` : À archiver
- `ARCHIVED` : Archivé
- `PENDING_DELETION` : À supprimer
- `DELETED` : Supprimé

**Règles métier** :
- Dossiers : 10 ans après clôture
- Factures : 10 ans (obligation fiscale)
- Documents : selon catégorie
- Emails : 3 ans
- Gel juridique possible (contentieux)

---

## 🔗 RELATIONS CRITIQUES

### Client → Dossier → Document → Proof
```
Client (1) ──→ (N) Dossier
Dossier (1) ──→ (N) Document
Dossier (1) ──→ (N) LegalDeadline
LegalDeadline (1) ──→ (1) Proof
Document (1) ──→ (N) Proof
```

### InformationUnit → Proof → AuditLog
```
InformationUnit (1) ──→ (N) Proof
Proof (1) ──→ (N) AuditLog
```

### LegalDeadline → DeadlineAlert → Notification
```
LegalDeadline (1) ──→ (N) DeadlineAlert
DeadlineAlert (1) ──→ (1) Notification
```

---

## 📊 INDEX CRITIQUES (PERFORMANCE)

### Recherche rapide
```prisma
@@index([tenantId, status])
@@index([contentHash])
@@index([dueDate])
@@index([timestamp])
```

### Audit et conformité
```prisma
@@index([userId, action])
@@index([entityType, entityId])
@@index([timestampHash])
```

### Délais
```prisma
@@index([status, dueDate])
@@index([dossierId, status])
```

---

## 🔐 CONTRAINTES D'INTÉGRITÉ

### Unicité
- `InformationUnit.contentHash` : Pas de doublon
- `Tenant.subdomain` : Unique
- `Client.tenantId_email` : Unique par tenant
- `Dossier.tenantId_numero` : Unique par tenant

### Cascade
- Suppression Tenant → Suppression User/Client/Dossier
- Suppression Dossier → Suppression Document/Email
- Suppression Client → Soft delete (ArchivePolicy)

### Validation
- `LegalDeadline.dueDate` > `referenceDate`
- `Proof.fileHash` : SHA-256 valide
- `AuditLog.timestampHash` : SHA-256 valide

---

## 🚀 MIGRATIONS CRITIQUES

### Migration initiale
1. Créer les tables de base (Plan, Tenant, User)
2. Créer les tables opérationnelles (Client, Dossier, Document)
3. Créer les tables juridiques (LegalDeadline, Proof, LegalReference)
4. Créer les tables de traçabilité (InformationUnit, AuditLog, ArchivePolicy)
5. Créer les index
6. Créer les contraintes

### Seed initial
1. Plans (Starter, Pro, Enterprise)
2. LegalReference (Articles CESEDA)
3. Tenant de démo
4. Super Admin

---

## 📝 RÈGLES MÉTIER GLOBALES

### 1. Aucune suppression physique
Toute suppression = soft delete + ArchivePolicy.

### 2. Toute action = AuditLog
Aucune exception.

### 3. Tout délai = LegalDeadline
Même les délais internes.

### 4. Toute information = InformationUnit
Email, upload, API, scan, fax.

### 5. Toute preuve = Proof
Avec hash SHA-256.

### 6. Tout changement de statut = trace immuable
InformationStatusHistory, AuditLog.

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Modèle de données figé
2. ⏳ Parcours utilisateur (User flows)
3. ⏳ Schéma Prisma final
4. ⏳ Migrations SQL
5. ⏳ Seed initial
6. ⏳ Tests d'intégrité

---

**Document figé le** : {{ DATE }}
**Auteur** : Équipe Produit
**Statut** : RÉFÉRENCE OFFICIELLE
