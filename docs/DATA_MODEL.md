# 🗄️ MODÈLE DE DONNÉES — ARCHITECTURE FACTUELLE

## PRINCIPES FONDATEURS

1. **Tout est horodaté** (createdAt, updatedAt)
2. **Tout est rattaché à un tenant** (isolation stricte)
3. **Rien n'est supprimé** (soft delete ou archivage)
4. **Toute action est tracée** (audit log)
5. **Les délais sont des entités** (pas des calculs)

---

## 🏗️ ENTITÉS PRINCIPALES

### 1. TENANT (Organisation)
```prisma
model Tenant {
  id                String   @id @default(cuid())
  name              String
  type              String   // "cabinet_avocat" | "notaire" | "entreprise"
  siret             String?  @unique
  
  // Limites
  maxUsers          Int      @default(5)
  maxClients        Int      @default(100)
  maxStorage        BigInt   @default(5368709120) // 5GB
  
  // Compteurs actuels
  currentUsers      Int      @default(0)
  currentClients    Int      @default(0)
  currentStorage    BigInt   @default(0)
  
  // Statut
  status            String   @default("active") // active | suspended | archived
  subscriptionEnd   DateTime?
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  users             User[]
  clients           Client[]
  dossiers          Dossier[]
  documents         Document[]
  delais            Delai[]
  auditLogs         AuditLog[]
  
  @@index([status])
}
```

---

### 2. USER (Utilisateur)
```prisma
model User {
  id                String   @id @default(cuid())
  tenantId          String
  
  email             String   @unique
  passwordHash      String
  
  firstName         String
  lastName          String
  role              String   // "super_admin" | "admin" | "user" | "readonly"
  
  // Sécurité
  lastLoginAt       DateTime?
  lastLoginIp       String?
  mfaEnabled        Boolean  @default(false)
  mfaSecret         String?
  
  // Statut
  status            String   @default("active") // active | suspended | archived
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  auditLogs         AuditLog[]
  notifications     Notification[]
  
  @@index([tenantId, status])
  @@index([email])
}
```

---

### 3. CLIENT (Personne physique ou morale)
```prisma
model Client {
  id                String   @id @default(cuid())
  tenantId          String
  
  // Identité
  civilite          String?  // "M" | "Mme" | "Autre"
  firstName         String
  lastName          String
  email             String
  phone             String?
  
  // Adresse
  address           String?
  codePostal        String?
  ville             String?
  
  // Informations complémentaires
  dateOfBirth       DateTime?
  nationality       String?
  
  // Statut
  status            String   @default("actif") // actif | inactif | archived
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  dossiers          Dossier[]
  documents         Document[]
  emails            Email[]
  factures          Facture[]
  evenements        Evenement[]
  
  @@unique([tenantId, email])
  @@index([tenantId, status])
}
```

---

### 4. DOSSIER (Affaire / Cas)
```prisma
model Dossier {
  id                String   @id @default(cuid())
  tenantId          String
  clientId          String
  
  // Identification
  numero            String   // Auto-généré : DOS-2024-0001
  titre             String
  description       String?
  
  // Classification
  type              String   // "contentieux" | "conseil" | "transaction" | "autre"
  domaine           String?  // "civil" | "penal" | "commercial" | "social" | "administratif"
  sousType          String?
  
  // Juridiction (si applicable)
  juridiction       String?  // "TJ Paris" | "CA Versailles" | etc.
  numeroRG          String?  // Numéro de Rôle Général
  
  // Statut
  status            String   @default("ouvert") // ouvert | en_cours | clos | archive
  priorite          String   @default("normale") // basse | normale | haute | urgente
  
  // Dates clés
  dateOuverture     DateTime @default(now())
  dateCloture       DateTime?
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tenant            Tenant      @relation(fields: [tenantId], references: [id])
  client            Client      @relation(fields: [clientId], references: [id])
  documents         Document[]
  delais            Delai[]
  evenements        Evenement[]
  factures          Facture[]
  
  @@unique([tenantId, numero])
  @@index([tenantId, status])
  @@index([clientId])
}
```

---

### 5. DOCUMENT (Pièce)
```prisma
model Document {
  id                String   @id @default(cuid())
  tenantId          String
  dossierId         String?
  clientId          String?
  
  // Identification
  nom               String
  type              String   // "piece_identite" | "contrat" | "jugement" | "courrier" | "autre"
  categorie         String?  // Classification métier
  
  // Stockage
  fileUrl           String
  fileName          String
  fileSize          BigInt
  mimeType          String
  
  // Hash pour intégrité
  sha256            String   @unique
  
  // Métadonnées
  dateDocument      DateTime? // Date du document (≠ date upload)
  description       String?
  tags              String[] // Recherche
  
  // Statut
  status            String   @default("actif") // actif | archive | supprime
  
  // Traçabilité CRITIQUE
  uploadedAt        DateTime @default(now())
  uploadedBy        String   // userId
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  dossier           Dossier? @relation(fields: [dossierId], references: [id])
  client            Client?  @relation(fields: [clientId], references: [id])
  evenements        Evenement[]
  
  @@index([tenantId, status])
  @@index([dossierId])
  @@index([sha256])
}
```

---

### 6. DELAI (Échéance juridique ou administrative)
```prisma
model Delai {
  id                String   @id @default(cuid())
  tenantId          String
  dossierId         String
  
  // Identification
  titre             String
  description       String?
  
  // Nature juridique
  type              String   // "legal" | "judiciaire" | "contractuel" | "interne"
  fondementLegal    String?  // Ex: "Art. 528 CPC" | "Art. 542 CPC"
  
  // Dates
  dateEcheance      DateTime
  dateRappel1       DateTime? // J-7
  dateRappel2       DateTime? // J-3
  dateRappel3       DateTime? // J-1
  
  // Statut
  status            String   @default("actif") // actif | respecte | depasse | annule
  priorite          String   @default("normale")
  
  // Alertes envoyées (PREUVE)
  alerteEnvoyee1    Boolean  @default(false)
  alerteEnvoyee2    Boolean  @default(false)
  alerteEnvoyee3    Boolean  @default(false)
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  respecteLe        DateTime?
  depasseLe         DateTime?
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  dossier           Dossier  @relation(fields: [dossierId], references: [id])
  evenements        Evenement[]
  
  @@index([tenantId, status, dateEcheance])
  @@index([dossierId])
}
```

---

### 7. EVENEMENT (Journal factuel)
```prisma
model Evenement {
  id                String   @id @default(cuid())
  tenantId          String
  dossierId         String?
  clientId          String?
  delaiId           String?
  documentId        String?
  
  // Nature
  type              String   // "action" | "communication" | "decision" | "delai" | "document"
  categorie         String   // "appel_telephonique" | "email" | "audience" | "depot_piece" | etc.
  
  // Contenu factuel
  titre             String
  description       String?
  
  // Horodatage CRITIQUE
  dateEvenement     DateTime // Date réelle de l'événement
  createdAt         DateTime @default(now()) // Date d'enregistrement
  
  // Acteurs
  acteurPrincipal   String?  // userId ou externe
  acteurSecondaire  String?
  
  // Métadonnées
  metadata          Json?    // Données structurées supplémentaires
  
  // Relations
  tenant            Tenant    @relation(fields: [tenantId], references: [id])
  dossier           Dossier?  @relation(fields: [dossierId], references: [id])
  client            Client?   @relation(fields: [clientId], references: [id])
  delai             Delai?    @relation(fields: [delaiId], references: [id])
  document          Document? @relation(fields: [documentId], references: [id])
  
  @@index([tenantId, dateEvenement])
  @@index([dossierId])
  @@index([type, categorie])
}
```

---

### 8. EMAIL (Communication entrante/sortante)
```prisma
model Email {
  id                String   @id @default(cuid())
  tenantId          String
  clientId          String?
  
  // Identification
  messageId         String   @unique // ID email original
  threadId          String?  // Regroupement conversation
  
  // Contenu
  subject           String
  body              String   @db.Text
  bodyHtml          String?  @db.Text
  
  // Expéditeur/Destinataire
  from              String
  to                String[]
  cc                String[]
  bcc               String[]
  
  // Métadonnées
  receivedAt        DateTime
  sentAt            DateTime?
  direction         String   // "inbound" | "outbound"
  
  // Pièces jointes
  hasAttachments    Boolean  @default(false)
  attachmentCount   Int      @default(0)
  
  // Statut
  status            String   @default("non_traite") // non_traite | traite | archive
  
  // Traçabilité
  createdAt         DateTime @default(now())
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  client            Client?  @relation(fields: [clientId], references: [id])
  
  @@index([tenantId, receivedAt])
  @@index([clientId])
  @@index([messageId])
}
```

---

### 9. FACTURE (Facturation)
```prisma
model Facture {
  id                String   @id @default(cuid())
  tenantId          String
  clientId          String
  dossierId         String?
  
  // Identification
  numero            String   // FAC-2024-0001
  
  // Montants
  montantHT         Decimal  @db.Decimal(10, 2)
  tauxTVA           Decimal  @db.Decimal(5, 2)
  montantTVA        Decimal  @db.Decimal(10, 2)
  montantTTC        Decimal  @db.Decimal(10, 2)
  
  // Dates
  dateEmission      DateTime @default(now())
  dateEcheance      DateTime
  datePaiement      DateTime?
  
  // Statut
  status            String   @default("emise") // emise | payee | en_retard | annulee
  
  // Traçabilité
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  client            Client   @relation(fields: [clientId], references: [id])
  dossier           Dossier? @relation(fields: [dossierId], references: [id])
  
  @@unique([tenantId, numero])
  @@index([tenantId, status])
  @@index([clientId])
}
```

---

### 10. AUDIT_LOG (Traçabilité absolue)
```prisma
model AuditLog {
  id                String   @id @default(cuid())
  tenantId          String
  userId            String?
  
  // Action
  action            String   // "create" | "read" | "update" | "delete" | "login" | "export"
  entity            String   // "Client" | "Dossier" | "Document" | etc.
  entityId          String?
  
  // Contexte
  ipAddress         String?
  userAgent         String?
  metadata          Json?    // Détails de l'action
  
  // Résultat
  success           Boolean  @default(true)
  errorMessage      String?
  
  // Horodatage IMMUABLE
  createdAt         DateTime @default(now())
  
  // Relations
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  user              User?    @relation(fields: [userId], references: [id])
  
  @@index([tenantId, createdAt])
  @@index([userId])
  @@index([entity, entityId])
}
```

---

### 11. NOTIFICATION (Alertes système)
```prisma
model Notification {
  id                String   @id @default(cuid())
  userId            String
  
  // Contenu
  type              String   // "delai" | "document" | "email" | "systeme"
  titre             String
  message           String
  
  // Lien
  entityType        String?  // "Dossier" | "Delai" | etc.
  entityId          String?
  
  // Statut
  read              Boolean  @default(false)
  readAt            DateTime?
  
  // Envoi
  sentViaEmail      Boolean  @default(false)
  sentViaSMS        Boolean  @default(false)
  
  // Traçabilité
  createdAt         DateTime @default(now())
  
  // Relations
  user              User     @relation(fields: [userId], references: [id])
  
  @@index([userId, read])
  @@index([createdAt])
}
```

---

## 🔐 RÈGLES DE SÉCURITÉ

### Isolation stricte
- Toute requête DOIT filtrer par `tenantId`
- Aucun accès cross-tenant possible
- Super Admin ne voit PAS les données métier

### Traçabilité
- Toute action = 1 ligne AuditLog
- Horodatage immuable
- Hash SHA256 pour documents

### Soft Delete
- Pas de DELETE en production
- Status = "archived" ou "supprime"
- Conservation légale respectée

---

## 📈 INDEXES CRITIQUES

```prisma
// Performance
@@index([tenantId, status])
@@index([tenantId, createdAt])
@@index([dossierId])
@@index([clientId])

// Sécurité
@@index([email])
@@index([sha256])

// Métier
@@index([dateEcheance])
@@index([type, categorie])
```

---

## 🎯 PROCHAINE ÉTAPE

Maintenant que le modèle est défini, je crée le **PARCOURS UTILISATEUR** aligné sur cette structure.

👉 Tape "go" pour continuer
