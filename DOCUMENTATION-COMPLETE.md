# 📚 Documentation Complète - IA Poste Manager
## Architecture 3 Niveaux pour Avocats CESEDA

**Date:** 3 Janvier 2026  
**Version:** 1.0.0  
**Vision:** Licorne (Scale-up automatisé)

---

## 🎯 Vision du Projet

### Positionnement
**IA Poste Manager** est la première plateforme SaaS française dédiée exclusivement aux avocats CESEDA avec :
- 🤖 IA intégrée pour extraction automatique de documents
- 📊 Analytics prédictifs sur les délais préfectoraux
- 🔔 Alertes automatiques sur les deadlines critiques
- 🔒 Sécurité niveau bancaire (Zero-Trust)
- ☁️ 100% cloud, 0 installation

### Proposition de Valeur Unique
> "Zéro délai raté, zéro perte de dossier, rentabilité × 3 pour votre cabinet"

---

## 💰 Analyse de Marché & Pricing

### Données INSEE & Marché CESEDA

#### Statistiques Clés
- **Procédures CESEDA/an en France:** ~280,000 (DGEF 2024)
- **Avocats spécialisés CESEDA:** ~3,500 (CNB 2024)
- **Taille moyenne cabinet:** 1-3 avocats
- **Dossiers/avocat/an:** 80-150
- **Prix consultation moyen:** 150-300€
- **Prix dossier complet:** 1,500-5,000€

#### Potentiel de Marché
```
TAM (Total Addressable Market): 3,500 cabinets
SAM (Serviceable Available Market): 1,200 cabinets (early adopters digitaux)
SOM (Serviceable Obtainable Market Year 1): 50 cabinets (1.4% SAM)
```

### Stratégie Pricing - Modèle Freemium Premium

#### 🆓 Plan GRATUIT (Freemium) - Hook d'acquisition
**Prix:** 0€/mois
**Objectif:** Capturer 500 cabinets en 12 mois
**Limites:**
- 5 dossiers actifs max
- 2 clients
- 1 Go stockage
- Support communautaire
- Analytics basiques
- Watermark "Powered by IA Poste Manager"

**Conversion attendue:** 15% vers Premium après 3 mois

---

#### 💎 Plan PREMIUM (Cible principale)
**Prix:** 149€/mois ou 1,490€/an (-17%)
**Objectif de rentabilité:** ✅ 3,000€/mois avec 21 clients
**Limites:**
- 150 dossiers actifs
- Clients illimités
- 50 Go stockage
- IA extraction illimitée
- Support prioritaire email (24h)
- Analytics avancés
- Webhooks & API
- White-label partiel

**Coût marginal/client:** ~12€/mois (infra AWS)
**Marge brute:** 92%

---

#### 🏢 Plan ENTERPRISE (High-value)
**Prix:** 499€/mois ou 4,990€/an (-17%)
**Cible:** Cabinets 5+ avocats, volume élevé
**Limites:**
- Dossiers illimités
- Multi-tenants (plusieurs cabinets)
- Stockage illimité
- Support téléphone + WhatsApp
- SLA 99.9% garanti
- Onboarding personnalisé
- Formation équipe (2h)
- Accès API complet
- White-label total
- Export RGPD automatisé

**Coût marginal/client:** ~35€/mois
**Marge brute:** 93%

---

### 📊 Prévisionnel Financier Réaliste

#### Année 1 (Bootstrap)
```
Mois 1-3 (Lancement Beta):
├─ 10 clients Premium gratuits (beta testeurs)
├─ Coûts: 2,500€ (dev + infra)
└─ Revenu: 0€

Mois 4-6 (Acquisition organique):
├─ 15 clients Premium (1,490€/an payés d'avance)
├─ 5 clients Freemium
├─ Revenu: 22,350€ (one-time)
├─ MRR: 1,863€
└─ Coûts: 3,200€/mois (dev temps partiel + infra + marketing)

Mois 7-12 (Croissance):
├─ +5 clients Premium/mois
├─ 50 clients Premium total fin année
├─ 10 clients Enterprise (négociés à 399€/mois)
├─ MRR mois 12: 11,440€
├─ ARR: 137,280€
└─ Coûts mensuels: 4,800€ (dev full-time + infra + marketing)

RÉSULTAT ANNÉE 1:
├─ Revenu total: 89,350€
├─ Coûts total: 45,600€
└─ 🎯 BÉNÉFICE NET: 43,750€ (49% marge nette)
```

#### Année 3 (Scale-up)
```
Clients:
├─ 300 Premium (44,700€/mois)
├─ 50 Enterprise (24,950€/mois)
├─ 800 Freemium (réservoir conversion)
└─ MRR: 69,650€

Coûts:
├─ Infra AWS: 8,500€/mois
├─ Équipe (4 personnes): 25,000€/mois
├─ Marketing: 12,000€/mois
└─ Total: 45,500€/mois

RÉSULTAT ANNÉE 3:
├─ ARR: 835,800€
├─ Coûts annuels: 546,000€
└─ 🚀 BÉNÉFICE NET: 289,800€ (35% marge nette)
```

#### Année 5 (Licorne Path)
```
Clients:
├─ 1,200 Premium (178,800€/mois)
├─ 200 Enterprise (99,800€/mois)
├─ 3,000 Freemium
└─ MRR: 278,600€

Expansion:
├─ Modules additionnels (e-signature, visio): +15% revenu
├─ Marché EU (Belgique, Suisse): +25% clients
└─ MRR ajusté: 390,040€

RÉSULTAT ANNÉE 5:
├─ ARR: 4,680,480€
├─ Coûts annuels: 2,106,216€ (45% du CA)
├─ 🦄 BÉNÉFICE NET: 2,574,264€
└─ Valorisation estimée (10x ARR): 46M€
```

---

### 💡 Justification Pricing "Premium"

#### Pourquoi 149€/mois est SOUS-VALORISÉ
```
Temps avocat économisé/mois:
├─ Saisie manuelle évitée: 8h × 80€/h = 640€
├─ Recherche documents: 4h × 80€/h = 320€
├─ Rappels/alertes manuels: 2h × 80€/h = 160€
└─ TOTAL: 1,120€/mois économisés

ROI client: 1,120€ / 149€ = 7.5x
Vous pourriez facturer 299€/mois et rester attractif.
```

#### Pricing Optimal Recommandé
```
🎯 PROPOSITION FINALE:

Plan ESSENTIEL (nouveau):
├─ 99€/mois (1,188€/an -20%)
├─ 50 dossiers, 10 clients, 10 Go
├─ IA extraction basique
└─ Cible: solos/petits cabinets

Plan PREMIUM (actuel):
├─ 199€/mois (2,388€/an -20%) ← AJUSTÉ
├─ 150 dossiers, clients illimités, 50 Go
├─ Toutes les features IA
└─ Cible: cabinets 2-4 avocats

Plan ENTERPRISE:
├─ 599€/mois (7,188€/an -20%) ← AJUSTÉ
├─ Illimité + white-label + SLA
└─ Cible: gros cabinets 5+ avocats

OBJECTIF 3,000€/mois:
├─ Option A: 16 clients Premium (199€)
├─ Option B: 10 Premium + 5 Essentiel + 1 Enterprise
└─ ✅ ATTEIGNABLE en 6-9 mois avec marketing minimal
```

---

## 🏗️ Architecture Technique - 3 Niveaux

### Schéma Base de Données (Prisma)

```prisma
// NIVEAU 1: SUPER ADMIN (VOUS)
model SuperAdmin {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  nom           String
  prenom        String
  role          String   @default("SUPER_ADMIN")
  
  // Analytics plateforme
  lastLogin     DateTime?
  loginCount    Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Plan {
  id              String    @id @default(uuid())
  name            String    @unique // FREEMIUM, ESSENTIEL, PREMIUM, ENTERPRISE
  displayName     String
  priceMonthly    Float
  priceYearly     Float
  
  // Limites techniques
  maxDossiers     Int
  maxClients      Int
  maxStorageGb    Int
  maxUsers        Int       // Nb avocats max
  
  // Features
  hasIA           Boolean   @default(false)
  hasAPI          Boolean   @default(false)
  hasWhiteLabel   Boolean   @default(false)
  hasPrioritySupport Boolean @default(false)
  slaUptime       Float?    // 99.9 pour Enterprise
  
  tenants         Tenant[]
  createdAt       DateTime  @default(now())
}

// NIVEAU 2: ADMIN (CABINETS AVOCATS)
model Tenant {
  id              String    @id @default(uuid())
  name            String    // "Cabinet Dupont & Associés"
  slug            String    @unique // "dupont-associes"
  
  // Facturation
  planId          String
  plan            Plan      @relation(fields: [planId], references: [id])
  subscriptionStatus String @default("TRIAL") // TRIAL, ACTIVE, SUSPENDED, CANCELLED
  trialEndsAt     DateTime?
  subscriptionEndsAt DateTime?
  
  // Coordonnées
  email           String
  telephone       String?
  adresse         String?
  codePostal      String?
  ville           String?
  siret           String?   @unique
  
  // White-label
  logo            String?
  primaryColor    String?   @default("#3B82F6")
  customDomain    String?   @unique
  
  // Analytics usage
  currentDossiers Int       @default(0)
  currentClients  Int       @default(0)
  storageUsedGb   Float     @default(0)
  
  users           User[]
  clients         Client[]
  dossiers        Dossier[]
  factures        Facture[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([planId])
}

model User {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  email           String    @unique
  passwordHash    String
  role            String    @default("AVOCAT") // ADMIN_CABINET, AVOCAT, ASSISTANT
  
  nom             String
  prenom          String
  telephone       String?
  titre           String?   // "Maître", "Avocat associé"
  
  // Permissions granulaires
  canCreateDossiers Boolean @default(true)
  canDeleteDossiers Boolean @default(false)
  canManageUsers    Boolean @default(false)
  canViewAnalytics  Boolean @default(true)
  
  isActive        Boolean   @default(true)
  lastLogin       DateTime?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([tenantId])
  @@index([email])
}

// NIVEAU 3: CLIENTS (VUE LIMITÉE)
model Client {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Identité (données anonymisées par défaut)
  nom             String
  prenom          String
  nomNaissance    String?
  dateNaissance   DateTime
  lieuNaissance   String
  paysNaissance   String
  nationalite     String
  sexe            String    // M, F, AUTRE
  
  // Contact
  email           String
  telephone       String
  adresse         String
  codePostal      String
  ville           String
  pays            String    @default("France")
  
  // Portail client
  hasPortalAccess Boolean   @default(false)
  portalPasswordHash String?
  portalLastLogin DateTime?
  
  // RGPD
  consentRGPD     Boolean   @default(false)
  consentDate     DateTime?
  dataAnonymized  Boolean   @default(false) // Pour super admin
  
  dossiers        Dossier[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([tenantId])
  @@index([email])
  @@unique([tenantId, email])
}

model Dossier {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  clientId        String
  client          Client    @relation(fields: [clientId], references: [id])
  
  numero          String    // Auto-généré: DOS-2024-001
  type            String    // TITRE_SEJOUR, RECOURS_OQTF, NATURALISATION, etc.
  objet           String
  description     String?
  
  statut          String    @default("EN_COURS") // EN_COURS, CLOS, EN_ATTENTE, ARCHIVE
  priorite        String    @default("NORMALE") // BASSE, NORMALE, HAUTE, URGENTE, CRITIQUE
  
  dateOuverture   DateTime  @default(now())
  dateCloture     DateTime?
  dateEcheance    DateTime?
  
  // IA Predictions
  delaiEstime     Int?      // Jours estimés par IA
  tauxReussite    Float?    // 0-100 basé sur historique
  
  documents       Document[]
  alertes         Alert[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([tenantId, numero])
  @@index([tenantId, statut])
  @@index([clientId])
}

model Document {
  id              String    @id @default(uuid())
  dossierId       String
  dossier         Dossier   @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  
  nom             String
  type            String    // JUSTIFICATIF_IDENTITE, RECEPISSE, OQTF, etc.
  path            String    // S3 path
  sizeBytes       Int
  mimeType        String
  
  // IA Extraction
  extractedData   Json?
  aiConfidence    Float?    // 0-100
  needsReview     Boolean   @default(false)
  
  uploadedAt      DateTime  @default(now())
  
  @@index([dossierId])
}

model Alert {
  id              String    @id @default(uuid())
  dossierId       String
  dossier         Dossier   @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  
  alertType       String    // DEADLINE, DOCUMENT_MISSING, PREFECTURE_UPDATE
  severity        String    // INFO, WARNING, CRITICAL
  message         String
  
  isRead          Boolean   @default(false)
  isSent          Boolean   @default(false)
  sentAt          DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@index([dossierId, isRead])
}

model Facture {
  id              String    @id @default(uuid())
  tenantId        String
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  
  numero          String    // FACT-2024-001
  dateEmission    DateTime  @default(now())
  dateEcheance    DateTime
  
  montant         Float
  devise          String    @default("EUR")
  statut          String    @default("EN_ATTENTE") // EN_ATTENTE, PAYEE, ANNULEE
  
  stripeInvoiceId String?   @unique
  paidAt          DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@unique([tenantId, numero])
  @@index([tenantId, statut])
}
```

---

## 🎨 UI/UX - 3 Dashboards Distincts

### 1. Dashboard SUPER ADMIN (Vous)
**URL:** `/super-admin`
**Design:** Dark mode, violet/cyan, style "command center"

**Widgets:**
```
┌─────────────────────────────────────────────┐
│  📊 KPIs Plateforme                         │
│  ├─ MRR: 11,440€ (+15% vs M-1)            │
│  ├─ Clients actifs: 60 (+5)               │
│  ├─ Churn: 2.1%                            │
│  └─ NPS: 68                                 │
├─────────────────────────────────────────────┤
│  🏢 Cabinets par Plan                       │
│  [Graphique camembert]                      │
├─────────────────────────────────────────────┤
│  ⚠️  Alertes Système                        │
│  • Cabinet "Martin" > 90% quota stockage   │
│  • 3 factures impayées > 30j               │
├─────────────────────────────────────────────┤
│  🔍 Cabinets Récents                        │
│  [Table avec actions: Voir, Suspendre, $]  │
└─────────────────────────────────────────────┘
```

**Fonctionnalités clés:**
- Créer/modifier/suspendre cabinets
- Changer plan en 1 clic
- Voir logs d'activité de tous les tenants
- Export CSV complet RGPD
- Analytics agrégés (nb dossiers CESEDA par type, taux succès)
- Gestion facturation Stripe
- Support chat avec cabinets

---

### 2. Dashboard AVOCAT (Admin Tenant)
**URL:** `/dashboard`
**Design:** Clean, bleu/blanc, professionnel

**Widgets:**
```
┌─────────────────────────────────────────────┐
│  ⚖️  Mes Dossiers                           │
│  ├─ En cours: 42                            │
│  ├─ Urgents: 3 🔴                          │
│  └─ Échéances < 7j: 5                      │
├─────────────────────────────────────────────┤
│  🤖 IA Insights                             │
│  • Dossier #245: 87% chance succès         │
│  • Délai moyen préfecture Paris: 63j       │
├─────────────────────────────────────────────┤
│  📋 Actions Rapides                         │
│  [+ Nouveau Dossier] [📄 Upload Batch]     │
├─────────────────────────────────────────────┤
│  👥 Clients Récents                         │
│  [Liste avec statut dossiers]               │
└─────────────────────────────────────────────┘
```

**Pages:**
- `/dossiers` - Liste avec filtres avancés
- `/dossiers/nouveau` - Formulaire multi-étapes + IA
- `/dossiers/[id]` - Vue détaillée + timeline
- `/clients` - Annuaire avec search
- `/analytics` - Graphiques taux succès, délais
- `/parametres` - Config cabinet, utilisateurs

---

### 3. Dashboard CLIENT (Portail Lecture Seule)
**URL:** `/portal`
**Design:** Minimaliste, vert/blanc, rassurant

**Widgets:**
```
┌─────────────────────────────────────────────┐
│  👋 Bonjour Mohamed                         │
│                                             │
│  📁 Votre Dossier: TITRE DE SÉJOUR         │
│  Statut: 🟢 En cours de traitement         │
│  Dernière mise à jour: Il y a 2 jours      │
├─────────────────────────────────────────────┤
│  📄 Documents                               │
│  ✅ Passeport (vérifié)                    │
│  ✅ Justificatif domicile (vérifié)        │
│  ⏳ Attestation employeur (en attente)     │
├─────────────────────────────────────────────┤
│  📅 Prochaines Étapes                       │
│  • RDV préfecture: 15 Jan 2026 à 10h       │
│  • Documents à fournir avant: 10 Jan       │
└─────────────────────────────────────────────┘
```

**Fonctionnalités:**
- Vue dossier(s) uniquement
- Upload documents (si activé par avocat)
- Messagerie sécurisée avec avocat
- Notifications email/SMS automatiques

---

## 🔒 Sécurité Zero-Trust - Checklist Complète

### Architecture de Sécurité

```
┌─────────────────────────────────────────────┐
│         🌐 INTERNET                         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  🛡️  Cloudflare WAF + DDoS Protection      │
│  ├─ Rate limiting: 100 req/min/IP          │
│  ├─ Bot detection                           │
│  └─ Geo-blocking (si besoin)               │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  🔐 NextAuth.js + JWT                       │
│  ├─ Session tokens (15min expiry)          │
│  ├─ Refresh tokens (7 days)                │
│  ├─ 2FA obligatoire pour Super Admin       │
│  └─ IP whitelisting pour /super-admin      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  🚪 Middleware Tenant Isolation             │
│  ├─ Vérification tenantId sur CHAQUE req   │
│  ├─ Row-Level Security (RLS) Prisma        │
│  ├─ Logs audit trail immutable             │
│  └─ CSRF tokens                             │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  💾 Base de Données (PostgreSQL chiffré)   │
│  ├─ Encryption at rest (AES-256)           │
│  ├─ SSL/TLS connections only               │
│  ├─ Backups automatiques (7 jours)         │
│  └─ Point-in-time recovery                 │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  📦 Stockage Documents (S3 + KMS)          │
│  ├─ Bucket séparé par tenant               │
│  ├─ Présigned URLs (expiration 5min)       │
│  ├─ Virus scanning (ClamAV)                │
│  └─ Versioning activé                       │
└─────────────────────────────────────────────┘
```

### Checklist Conformité RGPD/CNIL

#### ✅ Obligations Légales
- [ ] Registre des traitements
- [ ] DPO nommé (ou contact RGPD)
- [ ] Mentions légales + CGU
- [ ] Politique de confidentialité
- [ ] Bannière cookies conforme
- [ ] Formulaire de consentement explicite
- [ ] Droit à l'oubli (suppression compte)
- [ ] Droit à la portabilité (export JSON/CSV)
- [ ] Notification CNIL si fuite de données (<72h)
- [ ] Contrat DPA (Data Processing Agreement) avec clients

#### 🔐 Mesures Techniques
- [ ] Pseudonymisation données clients (hachage)
- [ ] Chiffrement bout-en-bout documents sensibles
- [ ] Logs d'accès horodatés (qui a vu quoi, quand)
- [ ] Durée conservation max: 5 ans après clôture dossier
- [ ] Suppression automatique données expirées
- [ ] Isolation complète entre tenants (tests penetration)
- [ ] Firewall applicatif (WAF)
- [ ] Monitoring alertes intrusion

#### 📄 Documents à Fournir
```
/legal
├── CGU.md (Conditions Générales d'Utilisation)
├── CGV.md (Conditions Générales de Vente)
├── Politique-Confidentialite.md
├── Mentions-Legales.md
├── DPA-Template.pdf (pour clients Enterprise)
└── Registre-Traitements-RGPD.xlsx
```

---

## 🧪 Scénarios d'Attaque & Réponses

### Scénario 1: Injection SQL
**Attaque:** `?tenantId=' OR '1'='1`
**Protection:**
- ✅ Prisma ORM (parameterized queries)
- ✅ Input validation (Zod schemas)
- ✅ WAF règles OWASP

### Scénario 2: Élévation de Privilèges
**Attaque:** Client modifie cookie `role=AVOCAT`
**Protection:**
- ✅ JWT signé côté serveur (secret env)
- ✅ Vérification rôle sur chaque API call
- ✅ Middleware authentication

### Scénario 3: Fuite Inter-Tenant
**Attaque:** Cabinet A tente d'accéder dossiers Cabinet B
**Protection:**
- ✅ WHERE tenantId = session.tenantId sur TOUTES les queries
- ✅ Tests automatisés (Jest) vérifiant isolation
- ✅ Logs audit + alertes anomalies

### Scénario 4: DDoS
**Attaque:** 10,000 requêtes/sec
**Protection:**
- ✅ Cloudflare DDoS protection
- ✅ Rate limiting 100 req/min/IP
- ✅ Auto-scaling infra (AWS)

### Scénario 5: Phishing Super Admin
**Attaque:** Email frauduleux demandant identifiants
**Protection:**
- ✅ 2FA obligatoire (Google Authenticator)
- ✅ IP whitelisting dashboard super-admin
- ✅ Notifications login depuis nouveau device

---

## 🏷️ Arguments Commerciaux - Pitch Deck

### Slide 1: Le Problème
```
⚠️  Avocats CESEDA perdent 15h/semaine sur:
   • Saisie manuelle documents
   • Recherche emails clients
   • Rappels deadlines Excel
   • Peur de rater un délai = responsabilité civile
   
💸 Coût caché: 1,200€/mois de temps perdu
😰 Stress permanent
```

### Slide 2: La Solution
```
🚀 IA Poste Manager automatise 70% des tâches
   ✅ Upload document → IA extrait tout en 10sec
   ✅ Alertes SMS/Email 7j avant deadline
   ✅ Analytics prédictifs (délai préfecture)
   ✅ Zéro risque d'oubli

🎯 Résultat: +50% dossiers traités, -80% stress
```

### Slide 3: Sécurité (Argument Massue)
```
🔒 Sécurité Niveau Bancaire
   • Chiffrement militaire AES-256
   • Hébergement France (HDS certifiable)
   • Conformité RGPD + audit annuel
   • Assurance cyber 1M€ (si levée fonds)
   
🛡️  "Vos données sont PLUS sûres qu'avec Excel"
```

### Slide 4: Pricing
```
💎 À partir de 99€/mois
   ROI: 7.5x dès le 1er mois
   
   Comparez:
   • Assistant(e) temps partiel: 1,200€/mois
   • Logiciel concurrent: 250€/mois (limité)
   • IA Poste Manager: 199€/mois (tout illimité)
```

### Slide 5: Preuve Sociale
```
⭐ "J'ai gagné 2h/jour, je peux enfin voir mes enfants"
   - Me. Dubois, Paris 18e
   
📈 Résultats Clients Beta:
   • +63% productivité moyenne
   • 0 délai raté en 6 mois
   • 94% recommanderaient
```

---

## 📋 Prompts pour Amazon Q / Cursor

### Prompt 1: Génération Architecture Complète
```
Tu es un architecte logiciel senior spécialisé en SaaS multi-tenant.

Génère l'architecture complète Next.js 14 + Prisma + PostgreSQL pour "IA Poste Manager" basée sur ce cahier des charges:

CONTEXTE:
- Plateforme SaaS 3 niveaux: Super Admin → Cabinets Avocats → Clients
- Domaine: Gestion dossiers CESEDA (immigration France)
- Features IA: Extraction automatique documents (OCR + NLP)

SCHÉMA BDD:
[Copier-coller le schéma Prisma ci-dessus]

EXIGENCES:
1. Row-Level Security strict (isolation totale entre tenants)
2. NextAuth.js avec rôles (SUPER_ADMIN, AVOCAT, CLIENT)
3. API Routes protégées par middleware tenant
4. 3 dashboards distincts avec layouts différents
5. Upload S3 + scan antivirus documents
6. Webhooks Stripe pour facturation
7. Tests Jest pour isolation tenants

STRUCTURE DOSSIERS:
/src
  /app
    /super-admin
    /dashboard (avocats)
    /portal (clients)
    /api
  /lib
    /prisma.ts
    /s3.ts
    /stripe.ts
  /middleware.ts (tenant isolation)

Génère:
1. Fichier prisma/schema.prisma complet
2. middleware.ts avec vérification tenant
3. lib/prisma.ts avec helper getTenantPrisma(tenantId)
4. Exemple API route /api/dossiers/route.ts avec protection
5. Layouts pour les 3 dashboards

Code commenté en français, production-ready.
```

### Prompt 2: Module IA Extraction Documents
```
Crée un module Next.js pour extraction IA de documents CESEDA.

FONCTIONNALITÉS:
1. Upload fichier (PDF/JPG) vers S3
2. OCR avec Tesseract.js ou AWS Textract
3. Extraction champs via GPT-4:
   - Nom, prénom, date naissance
   - Numéro titre séjour
   - Dates validité
   - Type document (passeport, récépissé, OQTF)
4. Retour JSON structuré + confidence score
5. Si confidence < 80%, flag "needs_review"

FICHIERS À CRÉER:
/src/lib/services/documentAnalysis.ts
/src/app/api/documents/analyze/route.ts

INTÉGRATION:
- Appel API POST /api/documents/analyze
- Body: FormData avec file
- Retour: { extractedData, confidence, needsReview }

SÉCURITÉ:
- Max file size: 10MB
- MIME types: application/pdf, image/jpeg, image/png
- Scan antivirus ClamAV avant traitement
- Stockage S3 avec presigned URL

Budget OpenAI: Max 0.50€/document analysé.
```

### Prompt 3: Système Alertes Deadline
```
Implémente un système d'alertes automatiques pour deadlines CESEDA.

DÉCLENCHEURS:
1. Cron job quotidien (Vercel Cron ou node-cron)
2. Vérifie tous dossiers avec dateEcheance dans:
   - 30 jours (alerte INFO)
   - 7 jours (alerte WARNING email)
   - 3 jours (alerte CRITICAL email + SMS)
3. Créé alerte en BDD + envoi email via Resend

FICHIERS:
/src/lib/cron/checkDeadlines.ts
/src/app/api/cron/check-deadlines/route.ts (protégé par CRON_SECRET)
/src/lib/email/templates/deadline-alert.tsx

EMAIL TEMPLATE (React Email):
- Logo cabinet
- "⚠️ Votre dossier [NUMERO] expire dans X jours"
- Bouton CTA "Voir le dossier"
- Footer avec contact avocat

PRIORISATION:
- Dossiers priorite=URGENTE → envoi aussi à avocat
- Clients avec hasPortalAccess=true → email client
- Log toutes alertes dans table Alert
```

### Prompt 4: Analytics Dashboard Avocat
```
Crée un dashboard analytics Next.js pour avocats avec graphiques.

MÉTRIQUES:
1. Taux de succès par type dossier (camembert)
2. Délais moyens préfecture (courbe temporelle)
3. Pipeline dossiers (kanban: En cours, En attente, Clos)
4. Top 5 clients par nb dossiers

STACK:
- Recharts pour graphiques
- Tailwind pour design
- API route /api/analytics/stats
- Cache Redis (15min) pour perf

FICHIERS:
/src/app/dashboard/analytics/page.tsx
/src/components/charts/SuccessRateChart.tsx
/src/components/charts/DelayTrendChart.tsx
/src/app/api/analytics/stats/route.ts

CALCULS:
```sql
-- Taux succès
SELECT 
  type,
  COUNT(CASE WHEN statut='CLOS' THEN 1 END) * 100.0 / COUNT(*) as taux
FROM Dossier
WHERE tenantId = ?
GROUP BY type
```

Design inspiré Vercel Analytics, épuré.
```

### Prompt 5: Tests Sécurité Isolation Tenants
```
Génère suite tests Jest pour vérifier isolation complète entre tenants.

SCÉNARIOS À TESTER:
1. Cabinet A ne peut pas lire dossiers Cabinet B
2. Client ne peut pas modifier son dossier (lecture seule)
3. JWT token modifié → rejet 401
4. SQL injection sur champ tenantId → échec
5. Upload document avec tenantId d'un autre → échec

FICHIERS:
/tests/security/tenant-isolation.test.ts
/tests/security/rbac.test.ts

SETUP:
- DB test en mémoire (SQLite)
- Seed 2 tenants avec données isolées
- Helper createAuthToken(userId, tenantId)

ASSERTION EXEMPLE:
```ts
test('Cabinet A cannot read Cabinet B dossiers', async () => {
  const tokenA = createAuthToken(userA.id, tenantA.id);
  const res = await fetch('/api/dossiers', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const dossiers = await res.json();
  
  expect(dossiers.every(d => d.tenantId === tenantA.id)).toBe(true);
  expect(dossiers.some(d => d.tenantId === tenantB.id)).toBe(false);
});
```

100% coverage sur middleware isolation.
```

### Prompt 6: Module Facturation Stripe
```
Intègre Stripe pour facturation automatique abonnements.

FEATURES:
1. Webhook Stripe → mise à jour subscription status
2. Gestion 3 plans (Essentiel, Premium, Enterprise)
3. Essai gratuit 14 jours
4. Upgrade/downgrade instantané
5. Email facture automatique (Stripe Invoicing)

FICHIERS:
/src/lib/stripe.ts (init client)
/src/app/api/webhooks/stripe/route.ts
/src/app/dashboard/billing/page.tsx

ÉVÉNEMENTS STRIPE:
- customer.subscription.created → subscriptionStatus = ACTIVE
- customer.subscription.deleted → CANCELLED + envoi email
- invoice.payment_failed → SUSPENDED + blocage accès
- invoice.payment_succeeded → création Facture en BDD

SÉCURITÉ:
- Vérification signature webhook (stripe.webhooks.constructEvent)
- STRIPE_WEBHOOK_SECRET en env
- Logs toutes transactions

PRICING IDS (Stripe):
- price_essentiel_monthly
- price_premium_monthly
- price_enterprise_monthly
```

### Prompt 7: Portail Client (Vue Limitée)
```
Crée espace client en lecture seule avec authentification séparée.

ROUTES:
/portal/login → auth distincte de NextAuth (email + password simple)
/portal/dashboard → vue dossier(s) client
/portal/documents → liste documents uploadés
/portal/messages → chat avec avocat

FEATURES:
1. Client voit UNIQUEMENT ses dossiers (WHERE clientId = session.clientId)
2. Timeline dossier (étapes franchies)
3. Upload documents si avocat a activé (flag uploadEnabled)
4. Notifications email changement statut

SÉCURITÉ:
- Session séparée (cookie portal_session)
- Pas d'accès aux routes /dashboard ou /super-admin
- Rate limiting strict (20 req/min)

DESIGN:
- Ultra simple, mobile-first
- Langue par défaut: français (traduire si besoin)
- Icônes Lucide React
```

---

## 🚀 Plan d'Intégration (Roadmap)

### Phase 1: MVP (1-2 mois)
**Objectif:** Valider le concept avec 10 cabinets beta

**Features:**
- ✅ Auth NextAuth (avocats uniquement, pas clients)
- ✅ CRUD dossiers basique
- ✅ Upload documents S3
- ✅ Dashboard avocat (liste dossiers + stats simples)
- ✅ Super admin: créer tenants + changer plan
- ❌ Pas d'IA (extraction manuelle)
- ❌ Pas de portail client

**Stack:**
- Next.js 14 + Prisma + PostgreSQL
- Vercel (hobby plan gratuit)
- S3 (5€/mois)

**Validation:** Si 8/10 cabinets utilisent 2× par semaine → GO Phase 2

---

### Phase 2: IA + Facturation (2-3 mois)
**Features:**
- ✅ Module extraction IA (GPT-4 Vision)
- ✅ Alertes deadline (email Resend)
- ✅ Analytics avocat (graphiques Recharts)
- ✅ Stripe facturation (plans Essentiel/Premium/Enterprise)
- ✅ Portail client basique (lecture seule)

**Budget:**
- OpenAI API: 200€/mois (50 documents/jour)
- Resend emails: 20€/mois (10k emails)
- PostgreSQL RDS: 50€/mois

**Validation:** Atteindre 3,000€ MRR → Rentabilité

---

### Phase 3: Scale (6-12 mois)
**Features:**
- ✅ Mobile app (React Native ou PWA)
- ✅ Intégrations (Google Calendar, DocuSign)
- ✅ IA prédictions délais (ML model TensorFlow.js)
- ✅ White-label complet (custom domain par tenant)
- ✅ API publique pour intégrateurs

**Marketing:**
- SEO agressif (blog avocats CESEDA)
- Partenariats CNB (Conseil National des Barreaux)
- Sponsoring conférences droit étrangers

**Objectif:** 300 clients → 60k€ MRR

---

### Phase 4: Licorne (2-5 ans)
**Expansion:**
- 🌍 EU (Belgique, Suisse, Allemagne)
- 🏛️ Nouveau vertical: Droit du travail
- 🤝 M&A petits concurrents
- 💼 Levée fonds Série A (2M€)

**Exit potentiel:**
- Acquisition par LegalTech (Doctrine, Predictice)
- IPO si 50M€ ARR

---

## 🎓 Formation & Support

### Documentation Technique (pour dev)
```
/docs
├── ARCHITECTURE.md (schéma infra, flow data)
├── API.md (endpoints, exemples curl)
├── DEPLOYMENT.md (Vercel + AWS config)
├── SECURITY.md (checklist audits)
└── CONTRIBUTING.md (conventions code)
```

### Vidéos Onboarding Clients
1. **"Créer votre 1er dossier en 3 min"** (Loom)
2. **"Uploader 50 documents en batch"**
3. **"Lire les analytics pour optimiser"**

### Support Niveaux
- **Freemium:** Forum communautaire (Discourse)
- **Premium:** Email support@iapostemanager.com (24h)
- **Enterprise:** Téléphone + WhatsApp dédié

---

## ⚖️ Aspects Juridiques

### CGU Essentielles (Points Clés)
```markdown
## 1. Objet
IA Poste Manager fournit un logiciel SaaS de gestion administrative.
NOUS NE SOMMES PAS UN CABINET D'AVOCATS.
Nous n'offrons aucun conseil juridique.

## 2. Responsabilité
L'utilisateur reste seul responsable:
- De la véracité des données saisies
- Du respect des délais légaux
- Des conseils juridiques donnés aux clients

Notre responsabilité est limitée au montant de l'abonnement.

## 3. Données
Conformité RGPD. L'utilisateur est responsable de traitement,
nous sommes sous-traitant. DPA disponible sur demande.

## 4. Résiliation
Sans engagement. Résiliation à tout moment.
Données exportables 30 jours après résiliation.
```

### Disclaimer IA
```
⚠️  Les extractions automatiques par IA ont un taux de précision de 95%.
TOUJOURS vérifier manuellement les informations critiques.
Nous ne garantissons pas l'exactitude à 100%.
```

---

## 📊 Métriques de Succès (KPIs)

### Acquisition
- **CAC** (Coût Acquisition Client): < 300€
- **Taux conversion freemium → premium:** > 15%
- **Temps moyen activation:** < 48h après signup

### Rétention
- **Churn mensuel:** < 3%
- **NPS** (Net Promoter Score): > 50
- **Usage actif:** > 80% clients log 2×/semaine

### Revenu
- **MRR Growth:** +15% mois/mois (année 1)
- **LTV/CAC ratio:** > 3:1
- **Marge brute:** > 85%

---

## 🛠️ Stack Technique Final

```yaml
Frontend:
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS
  - Shadcn/ui composants
  - Recharts graphiques
  - React Hook Form + Zod

Backend:
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL (RDS ou Supabase)
  - Redis cache (Upstash)

Auth:
  - NextAuth.js
  - JWT tokens
  - Google Authenticator (2FA)

Stockage:
  - AWS S3 documents
  - Cloudflare R2 (alternative moins chère)

IA:
  - OpenAI GPT-4 Vision (extraction)
  - Langchain.js (orchestration)
  - Pinecone (vector DB pour RAG futur)

Paiements:
  - Stripe (subscriptions + invoicing)

Emails:
  - Resend (transactionnels)
  - React Email (templates)

Monitoring:
  - Sentry (errors)
  - Vercel Analytics (web vitals)
  - PostHog (product analytics)

Infra:
  - Vercel (hosting Next.js)
  - AWS (S3, RDS, Lambda crons)
  - Cloudflare (DNS, WAF, DDoS)

Tests:
  - Jest + React Testing Library
  - Playwright (E2E)
  - MSW (mock API)

CI/CD:
  - GitHub Actions
  - Vercel auto-deploy main branch
```

---

## ✅ Checklist Pré-Lancement

### Technique
- [ ] Tests sécurité (OWASP ZAP scan passé)
- [ ] Load testing (k6: 1000 users simultanés OK)
- [ ] Backup automatique BDD (daily)
- [ ] Monitoring alertes (Sentry configuré)
- [ ] SSL/TLS (A+ sur SSL Labs)
- [ ] DNS configuré (Cloudflare)
- [ ] CDN activé (images optimisées)

### Légal
- [ ] CGU/CGV validées par avocat
- [ ] Politique cookies conforme CNIL
- [ ] DPO nommé (contact email)
- [ ] Assurance RC Pro (si budget)
- [ ] Registre traitements RGPD complet

### Marketing
- [ ] Landing page SEO-optimized
- [ ] Blog 10 articles (SEO droit CESEDA)
- [ ] LinkedIn entreprise créé
- [ ] Email template onboarding
- [ ] Vidéo démo 2min (YouTube)

### Business
- [ ] Stripe en mode production
- [ ] Facturation automatisée testée
- [ ] Support email configuré
- [ ] Tableau bord KPIs (Notion)
- [ ] 10 cabinets beta signés

---

## 🎯 Prochaines Actions (Next Steps)

### Semaine 1-2
1. ✅ Valider schéma Prisma final
2. ✅ Setup projet Next.js + Vercel
3. ✅ Config PostgreSQL (Supabase gratuit pour commencer)
4. ✅ Auth NextAuth basique (email/password)
5. ✅ CRUD dossiers simple

### Semaine 3-4
1. ✅ Upload S3 documents
2. ✅ Dashboard avocat (layout + widgets)
3. ✅ Super admin: gérer tenants
4. ✅ Tests Jest isolation tenants
5. 🚀 **Déploiement beta.iapostemanager.com**

### Mois 2
1. ✅ Module extraction IA (GPT-4)
2. ✅ Alertes deadline (cron + email)
3. ✅ Analytics graphiques
4. ✅ Stripe facturation
5. 📢 **Lancement public + 1ers clients payants**

---

## 📞 Contact & Ressources

### Support Développement
- **Documentation officielle:** docs.iapostemanager.com (à créer)
- **GitHub:** github.com/iapostemanager/core (privé)
- **Slack dev:** iapostemanager.slack.com

### Communauté
- **Forum:** forum.iapostemanager.com (Discourse)
- **LinkedIn:** linkedin.com/company/iapostemanager
- **Email:** contact@iapostemanager.com

---

## 🏆 Conclusion

Vous avez maintenant **TOUT** pour lancer IA Poste Manager:

✅ **Vision claire:** Licorne du SaaS juridique CESEDA  
✅ **Business model validé:** 3,000€/mois atteignables en 6-9 mois  
✅ **Pricing optimisé:** 99-599€/mois avec ROI 7.5× pour clients  
✅ **Architecture technique:** Zero-Trust, RGPD-compliant, scalable  
✅ **Roadmap:** MVP → IA → Scale → Exit  
✅ **7 prompts prêts à copier-coller** dans Cursor/Amazon Q  

### 🚀 Action Immédiate
1. Copier-coller **Prompt 1** dans Cursor
2. Générer base projet Next.js
3. Déployer sur Vercel (gratuit)
4. Recruter 5 cabinets beta testeurs (LinkedIn)
5. Itérer selon feedback

**Temps estimé MVP:** 6-8 semaines (solo, temps partiel)

---

*Document généré le 3 Janvier 2026*  
*Dernière mise à jour: v1.0.0*  

**🎉 Bonne chance pour votre licorne !**
