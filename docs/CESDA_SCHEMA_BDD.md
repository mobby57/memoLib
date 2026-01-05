# 🗄️ IA POSTE MANAGER — SCHÉMA BASE DE DONNÉES CESDA COMPLET

**Architecture Prisma optimisée — Multi-tenant + CESDA**

---

## 🎯 ARCHITECTURE GLOBALE

### Principes

```
SUPER ADMIN
    ↓
TENANT (Cabinet)
    ↓
USERS (Avocats)
    ↓
WORKSPACES CESDA
    ↓
CLIENTS + DOSSIERS + DOCUMENTS
```

**Multi-tenancy**: Isolation totale données par cabinet  
**CESDA-first**: Types procédures natifs  
**IA-ready**: Logs, suggestions, validations

---

## 📊 SCHÉMA PRISMA COMPLET

```prisma
// ============================================
// IA POSTE MANAGER — SCHÉMA CESDA COMPLET
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Production: PostgreSQL
  url      = env("DATABASE_URL")
}

// ============================================
// NIVEAU 1 : SUPER ADMIN
// ============================================

model Plan {
  id          String  @id @default(uuid())
  name        String  @unique // BASIC, PREMIUM, ENTERPRISE
  displayName String
  description String?

  // Tarification
  priceMonthly Float
  priceYearly  Float
  currency     String @default("EUR")

  // Limites CESDA
  maxWorkspaces      Int     @default(50)
  maxClients         Int     @default(100)
  maxStorageGb       Int     @default(10)
  maxUsers           Int     @default(5)
  maxAICallsPerMonth Int     @default(1000)

  // Capacités CESDA
  workspaceTypes String[] // ["OQTF"] ou ["OQTF", "ASILE", "TITRE", "RF", "NATURALISATION"]
  
  // Fonctionnalités IA
  aiMailAnalysis       Boolean @default(true)
  aiDocumentExtraction Boolean @default(true)
  aiDraftGeneration    Boolean @default(false) // Premium+
  aiJurisprudence      Boolean @default(false) // Premium+
  aiDeadlineEngine     Boolean @default(true)
  
  // Features avancées
  multiJurisdiction Boolean @default(false) // Enterprise
  analytics         Boolean @default(false) // Premium+
  apiAccess         Boolean @default(false) // Enterprise
  whiteLabel        Boolean @default(false) // Enterprise
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenants Tenant[]

  @@index([name])
}

// ============================================
// NIVEAU 2 : TENANT (CABINET)
// ============================================

model Tenant {
  id        String  @id @default(uuid())
  name      String  // "Cabinet Dupont & Associés"
  subdomain String  @unique // "dupont-associes"
  domain    String? @unique // "cabinet-dupont.fr" (optionnel)

  // Plan & Facturation
  planId         String
  plan           Plan      @relation(fields: [planId], references: [id])
  status         String    @default("trial") // trial, active, suspended, cancelled
  trialEndsAt    DateTime?
  billingEmail   String?
  
  // Usage actuel (limites)
  currentWorkspaces      Int   @default(0)
  currentClients         Int   @default(0)
  currentStorageGb       Float @default(0)
  currentAICallsThisMonth Int  @default(0)
  
  // Localisation
  country      String @default("FR")
  jurisdiction String @default("FR") // FR, BE, CH, etc.
  
  // Branding (Enterprise)
  logoUrl      String?
  primaryColor String? @default("#1E40AF")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users            User[]
  clients          Client[]
  workspaces       Workspace[]
  documents        Document[]
  aiActions        AIAction[]
  alerts           Alert[]
  settings         TenantSettings?
  metrics          TenantMetrics[]

  @@index([planId])
  @@index([status])
}

model TenantSettings {
  id       String @id @default(uuid())
  tenantId String @unique
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Préférences IA
  aiAutoAnalyzeMails    Boolean @default(true)
  aiAutoCreateWorkspace Boolean @default(false) // Nécessite validation
  aiLanguagePreference  String  @default("fr") // fr, en, es, ar
  
  // Notifications
  emailAlertsCritical Boolean @default(true)
  emailAlertsDaily    Boolean @default(true)
  emailWeeklySummary  Boolean @default(false)
  
  // Conformité
  dataRetentionDays Int    @default(3650) // 10 ans (obligation légale avocat)
  gdprCompliant     Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Métriques cabinet (analytics)
model TenantMetrics {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  period String // "2026-01" (mois)

  // Volumes
  workspacesCreated   Int @default(0)
  workspacesClosed    Int @default(0)
  documentsUploaded   Int @default(0)
  aiCallsTotal        Int @default(0)
  
  // Performance
  averageTimeToClose Float? // Jours moyen clôture dossier
  deadlinesRespected Int   @default(0)
  deadlinesMissed    Int   @default(0)
  
  // Répartition procédures
  oqtfCount            Int @default(0)
  asileCount           Int @default(0)
  titreCount           Int @default(0)
  regroupementCount    Int @default(0)
  naturalisationCount  Int @default(0)
  
  // IA
  aiSuggestionsAccepted Int @default(0)
  aiSuggestionsRejected Int @default(0)
  aiDraftsUsed          Int @default(0)
  
  // Coûts IA (si API externe)
  aiCostEur Float @default(0)
  
  createdAt DateTime @default(now())

  @@unique([tenantId, period])
  @@index([tenantId, period])
}

// ============================================
// NIVEAU 3 : UTILISATEURS (AVOCATS)
// ============================================

model User {
  id       String  @id @default(uuid())
  tenantId String
  tenant   Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identité
  email     String
  name      String
  firstName String?
  lastName  String?
  
  // Auth (NextAuth compatible)
  emailVerified DateTime?
  image         String?
  
  // Rôle dans cabinet
  role String @default("lawyer") // admin, lawyer, assistant, readonly
  
  // Spécialités CESDA
  specialties String[] // ["OQTF", "ASILE"]
  
  // Préférences
  language        String  @default("fr")
  notificationsEnabled Boolean @default(true)
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  workspacesCreated Workspace[]    @relation("WorkspaceCreator")
  workspacesAssigned Workspace[]   @relation("WorkspaceAssigned")
  aiActions         AIAction[]
  accounts          Account[]
  sessions          Session[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
}

// NextAuth
model Account {
  id                String  @id @default(uuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ============================================
// NIVEAU 4 : CLIENTS
// ============================================

model Client {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identité
  firstName   String
  lastName    String
  email       String?
  phone       String?
  nationality String? // Code pays ISO (DZ, MA, SY, etc.)
  
  // Naissance
  birthDate    DateTime?
  birthPlace   String?
  birthCountry String?
  
  // Adresse France
  address    String?
  postalCode String?
  city       String?
  
  // Statut administratif
  currentStatus String? // "sans_papiers", "recepisse", "titre_sejour", "naturalise"
  
  // Vulnérabilités (important CESDA)
  vulnerabilities String[] // ["mineur", "handicap", "torture", "lgbt", "maladie_grave"]
  
  // Communication
  preferredLanguage String @default("fr")
  needsInterpreter  Boolean @default(false)
  interpreterLang   String?
  
  // Consentement RGPD
  gdprConsent     Boolean  @default(false)
  gdprConsentDate DateTime?
  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  workspaces Workspace[]
  documents  Document[]

  @@index([tenantId])
  @@index([email])
}

// ============================================
// NIVEAU 5 : WORKSPACES CESDA (CŒUR MÉTIER)
// ============================================

model Workspace {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  clientId String
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  // Type procédure CESDA
  procedureType String // OQTF, REFUS_TITRE, RETRAIT_TITRE, ASILE, REGROUPEMENT_FAMILIAL, NATURALISATION
  
  // Informations générales
  title       String // "OQTF - M. DUBOIS"
  description String?
  reference   String? @unique // Référence cabinet (auto-générée ou manuelle)
  
  // Statut
  status String @default("active") // active, pending, closed, archived
  
  // Urgence (calculée automatiquement)
  urgencyLevel String @default("moyen") // faible, moyen, eleve, critique
  
  // Délais
  notificationDate DateTime? // Date notification décision administrative
  deadlineDate     DateTime? // Date limite action (calculée)
  closedAt         DateTime?
  
  // Affectation
  createdById  String
  createdBy    User   @relation("WorkspaceCreator", fields: [createdById], references: [id])
  assignedToId String?
  assignedTo   User?  @relation("WorkspaceAssigned", fields: [assignedToId], references: [id])
  
  // Métadonnées CESDA spécifiques (JSON flexible)
  metadata Json? // {oqtfType: "sans_delai", mode_notification: "main_propre", etc.}
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  checklist      ChecklistItem[]
  documents      Document[]
  aiActions      AIAction[]
  alerts         Alert[]
  documentDrafts DocumentDraft[]
  timeline       Timeline[]

  @@index([tenantId])
  @@index([clientId])
  @@index([procedureType])
  @@index([status])
  @@index([urgencyLevel])
  @@index([deadlineDate])
}

// ============================================
// CHECKLISTS CESDA
// ============================================

model ChecklistItem {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Item
  category    String // "verifications", "pieces", "actions"
  label       String
  description String?
  
  // État
  completed   Boolean  @default(false)
  completedAt DateTime?
  required    Boolean  @default(false) // Si true, bloque certaines actions
  
  // Ordre affichage
  order Int @default(0)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([category])
}

// ============================================
// DOCUMENTS
// ============================================

model Document {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)

  clientId String?
  client   Client? @relation(fields: [clientId], references: [id], onDelete: SetNull)

  // Fichier
  filename     String
  originalName String
  mimeType     String
  sizeBytes    Int
  storagePath  String // Chemin S3, Azure Blob, ou local
  
  // Métadonnées
  documentType String // "decision_administrative", "passeport", "justificatif_domicile", etc.
  description  String?
  
  // Extraction IA
  aiProcessed     Boolean  @default(false)
  aiExtractedData Json? // Données extraites (dates, noms, etc.)
  aiConfidence    Float? // Score confiance 0-1
  
  // Validation humaine
  verified      Boolean  @default(false)
  verifiedAt    DateTime?
  
  uploadedAt DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([tenantId])
  @@index([workspaceId])
  @@index([clientId])
  @@index([documentType])
}

// ============================================
// BROUILLONS GÉNÉRÉS PAR IA
// ============================================

model DocumentDraft {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Type
  draftType String // "recours_contentieux", "recours_gracieux", "courrier_client", "memoire"
  title     String
  
  // Contenu
  content    String // Markdown ou HTML
  metadata   Json? // Sources jurisprudence, moyens utilisés, etc.
  
  // Statut validation
  status       String   @default("draft") // draft, reviewed, approved, rejected
  reviewedById String?
  reviewedAt   DateTime?
  
  // Utilisation
  exported   Boolean  @default(false)
  exportedAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([workspaceId])
  @@index([status])
}

// ============================================
// ACTIONS IA (AUDIT TRAIL)
// ============================================

model AIAction {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: SetNull)

  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)

  // Action
  actionType String // "mail_analysis", "document_extraction", "draft_generation", "jurisprudence_search"
  prompt     String? // Prompt utilisé (si applicable)
  
  // Résultat
  result     Json? // Résultat IA (structuré)
  confidence Float? // Score confiance
  
  // Validation humaine
  validated     Boolean @default(false)
  validatedAt   DateTime?
  validatedById String?
  
  // Coût (si API externe)
  costEur Float? @default(0)
  
  createdAt DateTime @default(now())

  @@index([tenantId])
  @@index([workspaceId])
  @@index([actionType])
  @@index([createdAt])
}

// ============================================
// ALERTES & NOTIFICATIONS
// ============================================

model Alert {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  workspaceId String?
  workspace   Workspace? @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Type & Niveau
  alertType String // "deadline_critical", "document_missing", "incoherence_detected"
  level     String // "info", "warning", "critical"
  
  // Message
  title   String
  message String
  
  // État
  read      Boolean  @default(false)
  readAt    DateTime?
  resolved  Boolean  @default(false)
  resolvedAt DateTime?
  
  createdAt DateTime @default(now())

  @@index([tenantId])
  @@index([workspaceId])
  @@index([level])
  @@index([read])
}

// ============================================
// TIMELINE (HISTORIQUE WORKSPACE)
// ============================================

model Timeline {
  id          String @id @default(uuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  // Événement
  eventType String // "created", "document_added", "deadline_updated", "status_changed", "ai_suggestion", "human_validation"
  title     String
  description String?
  
  // Acteur
  actorType String // "user", "ai", "system"
  actorId   String? // userId si user
  
  // Métadonnées
  metadata Json?
  
  createdAt DateTime @default(now())

  @@index([workspaceId])
  @@index([createdAt])
}

// ============================================
// FORMULAIRES COLLECTE CLIENT
// ============================================

model CollectionForm {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Lien workspace
  workspaceId String? // Peut être créé avant workspace (mail détection)
  
  // Type procédure
  procedureType String
  
  // Formulaire (JSON structure)
  formStructure Json // Questions adaptées procédure
  
  // Réponses client
  responses Json? // Réponses fournies
  
  // Statut
  status      String   @default("sent") // sent, partially_completed, completed
  completedAt DateTime?
  
  // Lien sécurisé (token)
  accessToken String   @unique @default(uuid())
  expiresAt   DateTime? // Optionnel
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([accessToken])
}

// ============================================
// INDEX JURISPRUDENCE (OPTIONNEL PREMIUM)
// ============================================

model Jurisprudence {
  id String @id @default(uuid())

  // Identification
  jurisdiction String // "CE", "CAA_PARIS", "TA_PARIS"
  decisionNumber String?
  decisionDate   DateTime
  
  // Référencement
  title    String
  summary  String
  url      String?
  
  // Classification CESDA
  procedureTypes String[] // ["OQTF", "ASILE"]
  articles       String[] // ["L.511-1 CESEDA", "Art. 8 CEDH"]
  keywords       String[]
  
  // Contenu
  fullText String? // Optionnel (très lourd)
  
  // Pertinence
  priority Int @default(0) // Arrêts de principe = haute priorité
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([jurisdiction])
  @@index([decisionDate])
  @@index([procedureTypes])
}
```

---

## 🔗 RELATIONS PRINCIPALES

### Vue simplifiée

```
Tenant (1) ──→ (N) User
Tenant (1) ──→ (N) Client
Tenant (1) ──→ (N) Workspace

Client (1) ──→ (N) Workspace
Client (1) ──→ (N) Document

Workspace (1) ──→ (N) ChecklistItem
Workspace (1) ──→ (N) Document
Workspace (1) ──→ (N) DocumentDraft
Workspace (1) ──→ (N) Alert
Workspace (1) ──→ (N) Timeline
Workspace (1) ──→ (N) AIAction

User (créateur) ──→ (N) Workspace
User (assigné) ──→ (N) Workspace
```

---

## 📐 TYPES ENUM RECOMMANDÉS

### À implémenter TypeScript

```typescript
enum ProcedureType {
  OQTF = "OQTF",
  REFUS_TITRE = "REFUS_TITRE",
  RETRAIT_TITRE = "RETRAIT_TITRE",
  ASILE = "ASILE",
  REGROUPEMENT_FAMILIAL = "REGROUPEMENT_FAMILIAL",
  NATURALISATION = "NATURALISATION"
}

enum WorkspaceStatus {
  ACTIVE = "active",
  PENDING = "pending",
  CLOSED = "closed",
  ARCHIVED = "archived"
}

enum UrgencyLevel {
  FAIBLE = "faible",
  MOYEN = "moyen",
  ELEVE = "eleve",
  CRITIQUE = "critique"
}

enum DocumentType {
  DECISION_ADMINISTRATIVE = "decision_administrative",
  PASSEPORT = "passeport",
  JUSTIFICATIF_DOMICILE = "justificatif_domicile",
  JUSTIFICATIF_RESSOURCES = "justificatif_ressources",
  ACTE_NAISSANCE = "acte_naissance",
  ACTE_MARIAGE = "acte_mariage",
  CERTIFICAT_SCOLARITE = "certificat_scolarite",
  ATTESTATION_TRAVAIL = "attestation_travail",
  PREUVE_NOTIFICATION = "preuve_notification",
  AUTRE = "autre"
}

enum AlertLevel {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical"
}

enum TenantStatus {
  TRIAL = "trial",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled"
}
```

---

## 🎯 REQUÊTES PRISMA TYPES

### Créer workspace OQTF complet

```typescript
const workspace = await prisma.workspace.create({
  data: {
    tenantId: "xxx",
    clientId: "yyy",
    procedureType: "OQTF",
    title: "OQTF - M. DUBOIS",
    notificationDate: new Date("2025-12-30"),
    deadlineDate: new Date("2026-01-01T18:00:00"),
    urgencyLevel: "critique",
    createdById: userId,
    metadata: {
      oqtfType: "sans_delai",
      modeNotification: "main_propre",
      paysDestination: "Algérie"
    },
    checklist: {
      create: [
        { category: "verifications", label: "Type OQTF identifié", required: true, order: 1 },
        { category: "verifications", label: "Date notification confirmée", required: true, order: 2 },
        { category: "pieces", label: "Décision OQTF", required: true, order: 1 },
        { category: "pieces", label: "Preuve notification", required: true, order: 2 },
      ]
    },
    timeline: {
      create: {
        eventType: "created",
        title: "Workspace créé",
        actorType: "user",
        actorId: userId
      }
    }
  },
  include: {
    client: true,
    checklist: true,
    createdBy: true
  }
})
```

### Dashboard avocat avec urgences

```typescript
const urgentWorkspaces = await prisma.workspace.findMany({
  where: {
    tenantId: tenantId,
    status: "active",
    urgencyLevel: { in: ["critique", "eleve"] },
    deadlineDate: { gte: new Date() }
  },
  include: {
    client: { select: { firstName: true, lastName: true } },
    _count: { select: { checklist: true, documents: true } }
  },
  orderBy: { deadlineDate: "asc" }
})
```

### Analytics mensuel

```typescript
const metrics = await prisma.tenantMetrics.findUnique({
  where: {
    tenantId_period: {
      tenantId: tenantId,
      period: "2026-01"
    }
  }
})
```

---

## 🔐 SÉCURITÉ & RGPD

### Row Level Security (RLS)

**Principe**: Isolation totale par `tenantId`

Toute requête DOIT inclure:

```typescript
where: { tenantId: session.user.tenantId }
```

### Middleware Prisma

```typescript
prisma.$use(async (params, next) => {
  // Auto-inject tenantId
  if (params.model && params.args.where) {
    params.args.where.tenantId = currentTenantId
  }
  return next(params)
})
```

### Champs sensibles

* `Client.email` — Chiffré au repos
* `Document.storagePath` — Accès signés temporaires
* `AIAction.prompt` — Peut contenir données perso

### Rétention données

* Conservation: 10 ans minimum (obligation avocat)
* Soft delete recommandé (status archived)
* Purge anonymisée après délai légal

---

## ⚡ OPTIMISATIONS

### Index critiques

```prisma
@@index([tenantId, status, deadlineDate]) // Dashboard
@@index([tenantId, procedureType, createdAt]) // Analytics
@@index([workspaceId, category]) // Checklist
```

### Pagination

```typescript
const workspaces = await prisma.workspace.findMany({
  take: 20,
  skip: (page - 1) * 20,
  cursor: lastId ? { id: lastId } : undefined
})
```

### Agrégations

```typescript
const stats = await prisma.workspace.groupBy({
  by: ['procedureType', 'urgencyLevel'],
  where: { tenantId, status: 'active' },
  _count: true
})
```

---

## 🔄 MIGRATIONS PRISMA

### Commandes

```bash
# Créer migration
npx prisma migrate dev --name add_cesda_workspaces

# Appliquer en prod
npx prisma migrate deploy

# Reset dev (DANGER)
npx prisma migrate reset

# Seed data
npx prisma db seed
```

### Seed exemple

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Plans
  const basicPlan = await prisma.plan.create({
    data: {
      name: "BASIC",
      displayName: "Basic",
      priceMonthly: 49,
      priceYearly: 490,
      maxWorkspaces: 25,
      workspaceTypes: ["OQTF"],
      aiDraftGeneration: false
    }
  })

  const premiumPlan = await prisma.plan.create({
    data: {
      name: "PREMIUM",
      displayName: "Premium",
      priceMonthly: 149,
      priceYearly: 1490,
      maxWorkspaces: 200,
      workspaceTypes: ["OQTF", "ASILE", "REFUS_TITRE", "REGROUPEMENT_FAMILIAL", "NATURALISATION"],
      aiDraftGeneration: true,
      analytics: true
    }
  })

  // Tenant démo
  const tenant = await prisma.tenant.create({
    data: {
      name: "Cabinet Démo",
      subdomain: "demo",
      planId: premiumPlan.id,
      status: "trial",
      trialEndsAt: new Date("2026-02-01")
    }
  })

  console.log({ basicPlan, premiumPlan, tenant })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

---

## 🧪 TESTS PRISMA

### Exemple test

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Workspace CESDA', () => {
  it('calcule urgence automatiquement', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        tenantId: 'test',
        clientId: 'test',
        procedureType: 'OQTF',
        title: 'Test',
        createdById: 'user',
        notificationDate: new Date(),
        deadlineDate: new Date(Date.now() + 12 * 60 * 60 * 1000) // +12h
      }
    })

    // Logique calcul urgence (à implémenter)
    const urgency = calculateUrgency(workspace.deadlineDate)
    
    expect(urgency).toBe('critique')
  })
})
```

---

## 📊 VUES MATÉRIALISÉES (OPTIONNEL)

Pour analytics lourdes (Enterprise)

```sql
CREATE MATERIALIZED VIEW workspace_stats AS
SELECT 
  tenant_id,
  DATE_TRUNC('month', created_at) AS month,
  procedure_type,
  COUNT(*) AS total,
  AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/86400) AS avg_days_to_close
FROM workspaces
WHERE status = 'closed'
GROUP BY tenant_id, month, procedure_type;

-- Refresh quotidien
REFRESH MATERIALIZED VIEW workspace_stats;
```

---

## 🌐 MULTI-BASE (ENTERPRISE)

Si isolement complet par tenant

```typescript
// prisma/clients.ts
import { PrismaClient } from '@prisma/client'

const prismaClients = new Map<string, PrismaClient>()

export function getPrismaClient(tenantId: string) {
  if (!prismaClients.has(tenantId)) {
    const dbUrl = process.env[`DATABASE_URL_${tenantId.toUpperCase()}`]
    prismaClients.set(tenantId, new PrismaClient({ datasources: { db: { url: dbUrl } } }))
  }
  return prismaClients.get(tenantId)!
}
```

---

**Document créé le 01/01/2026**
**Version 1.0 — IA Poste Manager CESDA Schema BDD**
