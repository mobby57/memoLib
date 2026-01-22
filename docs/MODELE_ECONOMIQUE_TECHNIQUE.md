# 💰 MODÈLE ÉCONOMIQUE & ARCHITECTURE TECHNIQUE — IA POSTE MANAGER

**Version:** 1.0 Prod-Ready  
**Date:** 20 janvier 2026  
**Statut:** Prêt pour déploiement

---

## 🎯 VISION STRATÉGIQUE

> **Tu ne vends PAS une IA.**  
> **Tu vends la réduction du risque, du temps et des erreurs humaines.**

Un avocat, un cabinet, une entreprise **paie pour ne pas se tromper**.

---

## 💎 OFFRES COMMERCIALES (3 TIERS)

### 🟢 PLAN SOLO / ASSOCIATION

**Cible:** Avocat solo, petite association, structure indépendante

**Pricing:**
- **49€ - 79€ / mois**
- Ou **490€ - 790€ / an** (-20%)

**Limites techniques:**
```typescript
{
  maxWorkspaces: 1,          // 1 seul workspace actif
  maxDossiers: 50,           // 50 dossiers / mois
  maxClients: 20,            // 20 clients actifs
  maxStorageGb: 5,           // 5 GB stockage
  maxUsers: 1,               // 1 utilisateur
  aiAutonomyLevel: 1,        // Niveau IA basique
  humanValidation: true,     // Validation humaine obligatoire
  advancedAnalytics: false,  // Pas d'analytics avancés
  prioritySupport: false,    // Support standard
  customBranding: false,     // Pas de personnalisation
  apiAccess: false           // Pas d'API
}
```

**Justification commerciale:**
> "1 erreur évitée = bien plus que 79€. 1 délai manqué = perte client."

**Coût acquisition:** 0-50€ (marketing organique)  
**LTV (Lifetime Value):** ~950€ sur 12 mois  
**Churn estimé:** 15-20% (avocat solo sensible prix)

---

### 🔵 PLAN CABINET (SWEET SPOT)

**Cible:** Cabinet d'avocats 3-10 personnes, PME RH/immigration, cabinets spécialisés CESEDA

**Pricing:**
- **249€ - 490€ / mois**
- Ou **2490€ - 4900€ / an** (-20%)

**Limites techniques:**
```typescript
{
  maxWorkspaces: 10,         // 10 workspaces actifs simultanés
  maxDossiers: 300,          // 300 dossiers / mois
  maxClients: 100,           // 100 clients actifs
  maxStorageGb: 50,          // 50 GB stockage
  maxUsers: 5,               // 5 utilisateurs (avocats + assistants)
  aiAutonomyLevel: 2,        // IA intermédiaire
  humanValidation: true,     // Validation recommandée
  advancedAnalytics: true,   // Analytics inclus
  prioritySupport: true,     // Support prioritaire (email 24h)
  customBranding: false,     // Pas de white-label
  apiAccess: false           // Pas d'API
}
```

**Justification commerciale:**
> "1 collaborateur junior = 2000€/mois. IA Poste Manager = assistant infatigable pour 249€."

**Valeur comparée:**
- Assistant juridique junior: 24 000€/an
- IA Poste Manager Cabinet: 2 490€/an
- **ROI: 10x minimum**

**Coût acquisition:** 200-500€ (marketing ciblé, salons juridiques)  
**LTV:** ~6 000€ sur 24 mois  
**Churn estimé:** 8-12% (forte dépendance une fois adopté)

**🎯 C'est ICI que tu gagnes de l'argent.**

---

### 🔴 PLAN ENTERPRISE / INSTITUTION

**Cible:** Collectivités, grandes associations, cabinets nationaux, entreprises internationales

**Pricing:**
- **1 200€ - 3 000€ / mois**
- Ou **12 000€ - 30 000€ / an** (-20%)
- **Custom pricing** au-delà (négociation)

**Limites techniques:**
```typescript
{
  maxWorkspaces: -1,         // ILLIMITÉ (fair use)
  maxDossiers: -1,           // ILLIMITÉ (fair use)
  maxClients: -1,            // ILLIMITÉ
  maxStorageGb: 500,         // 500 GB (ou custom)
  maxUsers: 50,              // 50 utilisateurs (ou custom)
  aiAutonomyLevel: 4,        // IA avancée maximale
  humanValidation: false,    // Validation optionnelle (configurable)
  advancedAnalytics: true,   // Analytics + BI personnalisé
  externalAiAccess: true,    // Accès API externe (GPT-4, Claude)
  prioritySupport: true,     // Support dédié (SLA < 4h)
  customBranding: true,      // White-label complet
  apiAccess: true,           // API REST complète
  sso: true,                 // SSO Azure AD / SAML
  onPremise: optional,       // Déploiement on-premise si souhaité
  sla: "99.9%",              // Garantie disponibilité
  dataLocalization: "EU"     // Hébergement garanti UE
}
```

**Justification commerciale:**
> "Coût d'une erreur juridique = plusieurs centaines de milliers d'euros. Sécurité + Conformité = Premium justifié."

**Valeur comparée:**
- Équipe contentieux 5 personnes: 200 000€/an
- Risque contentieux mal géré: 500 000€+ (amendes, dommages)
- IA Poste Manager Enterprise: 14 400€/an
- **ROI: 15-35x**

**Coût acquisition:** 5 000-20 000€ (vente consultative longue, POC)  
**LTV:** ~60 000€ sur 36 mois  
**Churn estimé:** 3-5% (contrats pluriannuels, switching cost élevé)

**🦄 C'est ICI que tu construis la licorne.**

---

## 📊 PROJECTIONS FINANCIÈRES RÉALISTES

### Scénario Conservateur (Solo → Scale-up)

**Année 1:**
```
10 clients Cabinet @ 300€/mois  = 3 000€/mois
2 clients Solo @ 60€/mois       = 120€/mois
---------------------------------------------
TOTAL MENSUEL                   = 3 120€/mois
MRR (Monthly Recurring Revenue) = 3 120€
ARR (Annual Recurring Revenue)  = 37 440€

Coûts fixes:
- Hébergement (Cloudflare):     50€/mois
- Ollama/AI compute:            100€/mois
- Outils dev/ops:               200€/mois
- Marketing:                    500€/mois
---------------------------------------------
TOTAL COÛTS                     = 850€/mois

MARGE BRUTE                     = 2 270€/mois (73%)
```

**Année 2:**
```
50 clients Cabinet @ 350€/mois  = 17 500€/mois
10 clients Solo @ 65€/mois      = 650€/mois
5 clients Enterprise @ 1500€/mois = 7 500€/mois
---------------------------------------------
TOTAL MENSUEL                   = 25 650€/mois
MRR                             = 25 650€
ARR                             = 307 800€

Coûts:
- Infrastructure:               500€/mois
- Équipe (1 dev):               4 000€/mois
- Marketing/Sales:              2 000€/mois
- Support:                      1 000€/mois
---------------------------------------------
TOTAL COÛTS                     = 7 500€/mois

MARGE BRUTE                     = 18 150€/mois (71%)
```

**Année 3:**
```
300 clients Cabinet @ 350€/mois = 105 000€/mois
30 clients Solo @ 70€/mois      = 2 100€/mois
50 clients Enterprise @ 2000€/mois = 100 000€/mois
---------------------------------------------
TOTAL MENSUEL                   = 207 100€/mois
MRR                             = 207 100€
ARR                             = 2 485 200€

Coûts:
- Infrastructure:               3 000€/mois
- Équipe (8 personnes):         40 000€/mois
- Marketing/Sales:              20 000€/mois
- Support/Ops:                  10 000€/mois
---------------------------------------------
TOTAL COÛTS                     = 73 000€/mois

MARGE BRUTE                     = 134 100€/mois (65%)
EBITDA annuel                   = ~1 600 000€
```

**Valorisation potentielle (ARR × 8-12):**
- ARR Year 3: 2 485 200€
- Valorisation basse (×8): **19 881 600€**
- Valorisation haute (×12): **29 822 400€**

**🦄 Objectif licorne (valorisation > 1 milliard €) = ARR > 83M€**

---

## 🗄️ ARCHITECTURE TECHNIQUE (SCHÉMA PRISMA)

### 1️⃣ Modèle Plan

```prisma
model Plan {
  id          String  @id @default(uuid())
  name        String  @unique // SOLO, CABINET, ENTERPRISE
  displayName String  // "Plan Cabinet"
  description String?

  // Tarification
  priceMonthly Float   // 249
  priceYearly  Float   // 2490
  currency     String  @default("EUR")

  // Limites quotas
  maxWorkspaces Int @default(1)   // 1, 10, -1 (illimité)
  maxDossiers  Int @default(50)   // 50, 300, -1
  maxClients   Int @default(20)   // 20, 100, -1
  maxStorageGb Int @default(5)    // 5, 50, 500
  maxUsers     Int @default(1)    // 1, 5, 50

  // Capacités IA
  aiAutonomyLevel   Int     @default(1) // 1-4
  humanValidation   Boolean @default(true)
  advancedAnalytics Boolean @default(false)
  externalAiAccess  Boolean @default(false)

  // Services premium
  prioritySupport Boolean @default(false)
  customBranding  Boolean @default(false)
  apiAccess       Boolean @default(false)

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  tenants       Tenant[]
  subscriptions Subscription[]
}
```

**Valeurs seed (à créer):**

```typescript
const plans = [
  {
    name: "SOLO",
    displayName: "Plan Solo",
    description: "Pour avocats indépendants et petites structures",
    priceMonthly: 49,
    priceYearly: 490,
    maxWorkspaces: 1,
    maxDossiers: 50,
    maxClients: 20,
    maxStorageGb: 5,
    maxUsers: 1,
    aiAutonomyLevel: 1,
    humanValidation: true,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false
  },
  {
    name: "CABINET",
    displayName: "Plan Cabinet",
    description: "Pour cabinets d'avocats et structures moyennes",
    priceMonthly: 349,
    priceYearly: 3490,
    maxWorkspaces: 10,
    maxDossiers: 300,
    maxClients: 100,
    maxStorageGb: 50,
    maxUsers: 5,
    aiAutonomyLevel: 2,
    humanValidation: true,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: false,
    apiAccess: false
  },
  {
    name: "ENTERPRISE",
    displayName: "Plan Enterprise",
    description: "Pour grandes structures et institutions",
    priceMonthly: 1990,
    priceYearly: 19900,
    maxWorkspaces: -1, // illimité
    maxDossiers: -1,
    maxClients: -1,
    maxStorageGb: 500,
    maxUsers: 50,
    aiAutonomyLevel: 4,
    humanValidation: false,
    advancedAnalytics: true,
    externalAiAccess: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true
  }
];
```

---

### 2️⃣ Modèle Subscription (Abonnements actifs)

```prisma
model Subscription {
  id       String @id @default(uuid())
  tenantId String @unique
  tenant   Tenant @relation(...)

  planId String
  plan   Plan   @relation(...)

  // Statut
  status String @default("active") 
  // active, past_due, canceled, trialing

  // Facturation
  billingCycle String @default("monthly") // monthly, yearly
  
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  trialEnd           DateTime? // 14 jours gratuits
  canceledAt         DateTime?
  endedAt            DateTime?

  // Pricing
  pricePerMonth Float
  currency      String @default("EUR")
  autoRenew     Boolean @default(true)

  // Métadonnées externes (Stripe, etc.)
  metadata String? // JSON

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invoices     Invoice[]
  usageRecords UsageRecord[]
}
```

**Workflow abonnement:**

1. Tenant créé → Subscription créée en status "trialing"
2. Trial 14 jours → Notification J-3, J-1
3. Trial fin → Status "active" si paiement OK, sinon "past_due"
4. Chaque mois → Invoice générée automatiquement
5. Paiement échoué → Status "past_due" → 7 jours grace period → "canceled"
6. Upgrade/Downgrade → Nouvelle subscription créée, ancienne canceledAt

---

### 3️⃣ Modèle Invoice (Factures)

```prisma
model Invoice {
  id             String @id @default(uuid())
  subscriptionId String
  subscription   Subscription @relation(...)

  tenantId String
  tenant   Tenant @relation(...)

  // Numérotation
  invoiceNumber String @unique // INV-2026-001

  // Montants
  subtotal Float  // Montant HT
  tax      Float  @default(0) // TVA 20%
  total    Float  // Montant TTC

  currency String @default("EUR")

  // Statut
  status String @default("draft")
  // draft, open, paid, void, uncollectible

  // Dates
  issueDate DateTime @default(now())
  dueDate   DateTime // +30 jours
  paidAt    DateTime?
  voidedAt  DateTime?

  // Détails client
  billingEmail   String?
  billingAddress String?
  vatNumber      String?

  // Lignes de facturation (JSON)
  lineItems String
  // [{description: "Plan Cabinet", quantity: 1, unitPrice: 349, total: 349}]

  // Intégration externe
  metadata String? // {stripe_invoice_id: "inv_xxx", pdf_url: "..."}

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Génération automatique:**

```typescript
// Chaque début de mois (cron job)
async function generateMonthlyInvoices() {
  const activeSubscriptions = await prisma.subscription.findMany({
    where: { 
      status: "active",
      currentPeriodEnd: { lte: new Date() }
    },
    include: { tenant: true, plan: true }
  });

  for (const sub of activeSubscriptions) {
    const invoice = await prisma.invoice.create({
      data: {
        subscriptionId: sub.id,
        tenantId: sub.tenantId,
        invoiceNumber: generateInvoiceNumber(), // INV-2026-XXX
        subtotal: sub.pricePerMonth,
        tax: sub.pricePerMonth * 0.20, // TVA 20%
        total: sub.pricePerMonth * 1.20,
        status: "open",
        issueDate: new Date(),
        dueDate: addDays(new Date(), 30),
        billingEmail: sub.tenant.billingEmail,
        billingAddress: sub.tenant.billingAddress,
        vatNumber: sub.tenant.vatNumber,
        lineItems: JSON.stringify([{
          description: sub.plan.displayName,
          quantity: 1,
          unitPrice: sub.pricePerMonth,
          total: sub.pricePerMonth
        }])
      }
    });

    // Envoyer email facture
    await sendInvoiceEmail(invoice);
    
    // Renouveler période
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        currentPeriodStart: sub.currentPeriodEnd,
        currentPeriodEnd: addMonths(sub.currentPeriodEnd, 1)
      }
    });
  }
}
```

---

### 4️⃣ Modèle UsageRecord (Tracking usage)

```prisma
model UsageRecord {
  id             String @id @default(uuid())
  subscriptionId String
  subscription   Subscription @relation(...)

  tenantId String
  tenant   Tenant @relation(...)

  resourceType String 
  // workspace, dossier, client, storage_gb, ai_call

  quantity Float // Quantité consommée

  periodStart DateTime
  periodEnd   DateTime

  metadata String? // JSON: {workspace_id: "...", ai_model: "..."}

  recordedAt DateTime @default(now())
}
```

**Exemple d'utilisation:**

```typescript
// Quand un workspace est créé
await prisma.usageRecord.create({
  data: {
    subscriptionId: tenant.subscription.id,
    tenantId: tenant.id,
    resourceType: "workspace",
    quantity: 1,
    periodStart: startOfMonth(new Date()),
    periodEnd: endOfMonth(new Date()),
    metadata: JSON.stringify({ workspace_id: workspace.id })
  }
});

// Vérification quota
const currentUsage = await prisma.usageRecord.count({
  where: {
    tenantId: tenant.id,
    resourceType: "workspace",
    periodStart: { gte: startOfMonth(new Date()) }
  }
});

if (currentUsage >= tenant.plan.maxWorkspaces && tenant.plan.maxWorkspaces !== -1) {
  throw new Error("Quota workspaces dépassé. Upgrade requis.");
}
```

---

### 5️⃣ Modèle TenantUsageMetrics (Métriques agrégées)

```prisma
model TenantUsageMetrics {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(...)

  period      String @unique // "2026-01"
  periodStart DateTime
  periodEnd   DateTime

  // Volumes
  workspacesCreated    Int @default(0)
  workspacesClosed     Int @default(0)
  workspacesActiveEOM  Int @default(0) // End of month
  dossiersCreated      Int @default(0)
  clientsCreated       Int @default(0)
  usersActive          Int @default(0)
  storageUsedGb        Float @default(0)

  // IA Usage
  aiCallsTotal          Int @default(0)
  aiCallsFactExtraction Int @default(0)
  aiCallsContextId      Int @default(0)
  aiCallsRiskEval       Int @default(0)
  aiCallsActionProposal Int @default(0)

  // Performance
  avgWorkspaceCompletionTime Float? // Heures moyennes READY_FOR_HUMAN
  uncertaintyReductionAvg    Float? // Réduction incertitude moyenne

  // Quotas
  quotaWarnings Int @default(0) // Nombre fois proche limite
  quotaExceeded Int @default(0) // Nombre fois dépassé

  // Coûts IA
  aiCostEur Float @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Dashboard usage (pour tenant):**

```typescript
const metrics = await prisma.tenantUsageMetrics.findUnique({
  where: { 
    tenantId_period: { 
      tenantId: tenant.id, 
      period: "2026-01" 
    } 
  }
});

// Afficher:
// - Workspaces: 8 / 10 (80% utilisé)
// - Dossiers: 245 / 300 (82%)
// - Clients: 67 / 100 (67%)
// - Appels IA: 1250 (coût: 12.50€)
```

---

### 6️⃣ Modèle QuotaEvent (Alertes quotas)

```prisma
model QuotaEvent {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(...)

  quotaType String // workspaces, dossiers, clients, storage, users

  currentValue Int
  limitValue   Int
  percentage   Float // % utilisation

  eventType String 
  // warning (>80%), exceeded (>100%), critical (>120%)

  actionTaken String?
  // notification_sent, upgrade_suggested, feature_blocked

  metadata String? // JSON

  occurredAt DateTime @default(now())
}
```

**Automatisation:**

```typescript
async function checkQuotas(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true }
  });

  const quotas = [
    { type: "workspaces", current: tenant.currentWorkspaces, limit: tenant.plan.maxWorkspaces },
    { type: "dossiers", current: tenant.currentDossiers, limit: tenant.plan.maxDossiers },
    // ...
  ];

  for (const quota of quotas) {
    if (quota.limit === -1) continue; // Illimité

    const percentage = (quota.current / quota.limit) * 100;

    if (percentage >= 80 && percentage < 100) {
      await prisma.quotaEvent.create({
        data: {
          tenantId,
          quotaType: quota.type,
          currentValue: quota.current,
          limitValue: quota.limit,
          percentage,
          eventType: "warning",
          actionTaken: "notification_sent"
        }
      });
      await sendQuotaWarningEmail(tenant, quota);
    }

    if (percentage >= 100) {
      await prisma.quotaEvent.create({
        data: {
          tenantId,
          quotaType: quota.type,
          currentValue: quota.current,
          limitValue: quota.limit,
          percentage,
          eventType: "exceeded",
          actionTaken: "upgrade_suggested"
        }
      });
      await sendUpgradeOfferEmail(tenant, quota);
    }
  }
}
```

---

### 7️⃣ Modèle AuditLogEntry (RGPD + Zero-Trust)

```prisma
model AuditLogEntry {
  id String @id @default(uuid())

  tenantId String?
  tenant   Tenant? @relation(...)

  userId   String?
  userRole String?

  action     String // CREATE, READ, UPDATE, DELETE, LOGIN, etc.
  objectType String // WorkspaceReasoning, Document, Plan, etc.
  objectId   String?

  metadata  String? // JSON: détails action
  ipAddress String?
  userAgent String?

  success      Boolean @default(true)
  errorMessage String?

  hash String // SHA-256 pour intégrité

  containsPersonalData Boolean @default(false)
  dataCategories       String? // JSON: ["nom", "email"]

  occurredAt DateTime @default(now())
}
```

**Immutabilité garantie:**

```typescript
// AUCUN UPDATE/DELETE autorisé sur AuditLogEntry
// Append-only table

async function logAction(data: AuditLogData) {
  const entry = {
    ...data,
    occurredAt: new Date(),
    hash: calculateSHA256(JSON.stringify(data))
  };

  await prisma.auditLogEntry.create({ data: entry });
  
  // RGPD: si données personnelles, enregistrer
  if (entry.containsPersonalData) {
    await logPersonalDataAccess(entry);
  }
}
```

---

## 🔐 CONFORMITÉ RGPD

### ConsentRecord (Consentements clients)

```prisma
model ConsentRecord {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(...)

  clientId String
  client   Client @relation(...)

  consentType String 
  // data_processing, marketing, analytics, ai_analysis

  granted   Boolean
  grantedAt DateTime?
  revokedAt DateTime?

  policyVersion String // V1.0, V2.0

  metadata String? // JSON: source, ip, user_agent

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### DataSubjectRequest (Droits RGPD)

```prisma
model DataSubjectRequest {
  id       String @id @default(uuid())
  tenantId String
  tenant   Tenant @relation(...)

  clientId String?
  client   Client? @relation(...)

  requestType String 
  // access, rectification, erasure, portability, restriction

  status String @default("pending")
  // pending, in_progress, completed, rejected

  requestDetails String
  response       String?

  submittedAt DateTime @default(now())
  dueDate     DateTime // submittedAt + 30 jours (RGPD)
  completedAt DateTime?

  assignedTo String?
  priority   String @default("normal")

  metadata String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Workflow automatique:**

```typescript
// Client demande export données (droit RGPD)
const request = await prisma.dataSubjectRequest.create({
  data: {
    tenantId,
    clientId,
    requestType: "access",
    status: "pending",
    requestDetails: "Export complet données personnelles",
    submittedAt: new Date(),
    dueDate: addDays(new Date(), 30) // Obligation RGPD: réponse < 30j
  }
});

// Auto-assign à DPO ou admin
await assignToDataProtectionOfficer(request);

// Rappel automatique J-7, J-3, J-1
scheduleRGPDReminders(request);
```

---

## 🚀 NEXT STEPS TECHNIQUES

### 1. Migration Prisma

```bash
npx prisma migrate dev --name add_billing_system
npx prisma generate
```

### 2. Seed plans initiaux

```bash
npx tsx prisma/seed-plans.ts
```

### 3. Créer services facturation

```typescript
// src/lib/billing/subscription-service.ts
// src/lib/billing/invoice-service.ts
// src/lib/billing/quota-service.ts
```

### 4. Cron jobs

```typescript
// Génération factures mensuelles
schedule("0 0 1 * *", generateMonthlyInvoices);

// Vérification quotas quotidienne
schedule("0 8 * * *", checkAllTenantsQuotas);

// Rappels RGPD
schedule("0 9 * * *", checkRGPDDeadlines);
```

### 5. Dashboard admin

```typescript
// src/app/admin/billing/page.tsx
// - MRR/ARR en temps réel
// - Churn rate
// - Upgrade funnel
// - Quota usage heatmap
```

---

## 💰 SCALABILITÉ ÉCONOMIQUE

### Coûts variables par tenant

**Plan Solo (49€/mois):**
- Hébergement: ~0.50€/mois
- Compute IA (Ollama local): 0€
- Storage (5GB): ~0.10€/mois
- Support: ~1€/mois
- **Coût total: ~1.60€ → Marge: 97%**

**Plan Cabinet (349€/mois):**
- Hébergement: ~2€/mois
- Compute IA: ~5€/mois
- Storage (50GB): ~1€/mois
- Support: ~10€/mois
- **Coût total: ~18€ → Marge: 95%**

**Plan Enterprise (1990€/mois):**
- Hébergement dédié: ~50€/mois
- Compute IA externe (GPT-4): ~100€/mois
- Storage (500GB): ~10€/mois
- Support dédié: ~200€/mois
- **Coût total: ~360€ → Marge: 82%**

**Marges exceptionnelles = Business SaaS modèle.**

---

## 🎯 MÉTRIQUES CLÉS À TRACKER

```typescript
interface BusinessMetrics {
  // Revenus
  mrr: number;           // Monthly Recurring Revenue
  arr: number;           // Annual Recurring Revenue
  
  // Clients
  activeSubscriptions: number;
  churnRate: number;     // % clients perdus/mois
  
  // Acquisition
  cac: number;           // Customer Acquisition Cost
  ltv: number;           // Lifetime Value
  ltvCacRatio: number;   // Idéal: > 3
  
  // Engagement
  avgWorkspacesPerTenant: number;
  avgDossiersPerMonth: number;
  aiUsageRate: number;   // % workspaces utilisant IA
  
  // Quotas
  avgQuotaUsage: number; // % moyen utilisation quotas
  upgradeRate: number;   // % conversions Solo → Cabinet
  
  // Santé
  nps: number;           // Net Promoter Score
  supportTickets: number;
  avgResolutionTime: number; // heures
}
```

---

## 🦄 VISION LICORNE (EXIT STRATEGY)

### Leviers de croissance

1. **Datasets anonymisés (RGPD-compliant)**
   - Statistiques procédures CESEDA
   - Taux succès par type recours
   - Délais moyens par juridiction
   - **Valeur:** Vente données agrégées institutions

2. **Marketplace partenaires**
   - Intégrations Légifrance
   - Connecteurs juridictions (RPVA)
   - API cabinets expertise (médecins, traducteurs)
   - **Modèle:** Commission 10-20% sur transactions

3. **IA-as-a-Service**
   - API publique reasoning engine
   - White-label pour éditeurs legaltech
   - **Pricing:** 0.01€ / workspace analysé

4. **International**
   - UK Immigration Law
   - DE Aufenthaltsrecht
   - ES Derecho de extranjería
   - **Croissance:** ×5 marché adressable

5. **Vertical expansion**
   - Droit du travail
   - Droit de la famille
   - Droit pénal
   - **Objectif:** Plateforme universelle raisonnement juridique

### Valorisation cible

**ARR > 10M€ = Valorisation 80-120M€** (×8-12)  
**ARR > 50M€ = Valorisation 400-600M€**  
**ARR > 100M€ = Licorne (1Md€+)**

**Path to licorn:**
- Year 1-2: Product-Market Fit (PMF) en France CESEDA
- Year 3-4: Domination marché FR + expansion UK/DE
- Year 5-6: Plateforme multi-juridictions + marketplace
- Year 7+: Acquisition par legal giant (LexisNexis, Thomson Reuters) ou IPO

---

**Ce document technique est désormais LA RÉFÉRENCE pour tout développement billing/quotas/métriques.**

Prochaine étape logique:
1. **Migration Prisma** avec nouveaux modèles
2. **Seed plans** (Solo/Cabinet/Enterprise)
3. **Services facturation** (TypeScript)
4. **Dashboard billing** (Next.js)

Ou passer à:
4️⃣ **Argumentaire commercial sécurité/conformité** (pour vendre aux cabinets)
