# PROMPT COMPLET CURSOR/AMAZON Q - IA POSTE MANAGER

## 🎯 CONTEXTE GLOBAL

Vous êtes en train de développer **IA Poste Manager**, un SaaS multi-tenant B2B pour cabinets d'avocats spécialisés en droit CESEDA (immigration).

### Architecture 3-Tier

```
┌─────────────────────┐
│   SUPER_ADMIN       │  → Gestion plateforme (tous tenants)
└──────────┬──────────┘
           │
    ┌──────▼──────────┐
    │     ADMIN       │  → Avocats (gestion cabinet)
    └──────┬──────────┘
           │
    ┌──────▼──────────┐
    │    CLIENT       │  → Clients finaux (lecture seule)
    └─────────────────┘
```

### Principes Fondamentaux

1. **Isolation Tenant** : Chaque cabinet (tenant) a ses propres données complètement isolées
2. **Limites par Plan** : Basic (10 clients, 50 dossiers), Premium (50/200), Enterprise (illimité)
3. **IA Responsable** : Niveaux d'autonomie IA 1-4 selon plan, avec validation humaine obligatoire
4. **Charte IA** : L'IA est un assistant, JAMAIS un décisionnaire sur actes juridiques critiques

---

## 📊 SCHEMA PRISMA COMPLET

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// NIVEAU 1 : SUPER ADMIN - Plans & Tenants
// ============================================

model Plan {
  id                String   @id @default(cuid())
  nom               String   @unique // "Basic", "Premium", "Enterprise"
  prix              Float    // Prix mensuel en €
  maxClients        Int      // Limite nombre clients
  maxDossiers       Int      // Limite nombre dossiers
  aiAutonomyLevel   Int      @default(1) // 1-4 selon plan
  
  tenants           Tenant[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Tenant {
  id                String   @id @default(cuid())
  nom               String   // Nom du cabinet
  email             String   @unique
  telephone         String?
  adresse           String?
  
  planId            String
  plan              Plan     @relation(fields: [planId], references: [id])
  
  // Compteurs pour limites
  clientCount       Int      @default(0)
  dossierCount      Int      @default(0)
  
  isActive          Boolean  @default(true)
  
  users             User[]
  clients           Client[]
  dossiers          Dossier[]
  factures          Facture[]
  rendezVous        RendezVous[]
  documents         Document[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ============================================
// NIVEAU 2 : ADMIN & CLIENT - Utilisateurs
// ============================================

enum UserRole {
  SUPER_ADMIN
  ADMIN
  CLIENT
}

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String
  name              String
  role              UserRole @default(CLIENT)
  
  tenantId          String?
  tenant            Tenant?  @relation(fields: [tenantId], references: [id])
  
  clientId          String?  @unique
  client            Client?  @relation(fields: [clientId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Client {
  id                String   @id @default(cuid())
  nom               String
  prenom            String
  email             String
  telephone         String?
  adresse           String?
  nationalite       String?
  dateNaissance     DateTime?
  
  tenantId          String
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  
  user              User?    // Compte portail client (optionnel)
  
  dossiers          Dossier[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([tenantId, email])
}

// ============================================
// NIVEAU 3 : DONNÉES MÉTIER
// ============================================

enum StatutDossier {
  brouillon
  en_cours
  urgent
  termine
  archive
}

model Dossier {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: D-2026-001
  typeDossier       String        // "Recours OQTF", "Naturalisation", etc.
  objet             String
  statut            StatutDossier @default(brouillon)
  
  clientId          String
  client            Client        @relation(fields: [clientId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  dateOuverture     DateTime      @default(now())
  dateEcheance      DateTime?
  dateFermeture     DateTime?
  
  factures          Facture[]
  rendezVous        RendezVous[]
  documents         Document[]
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

enum StatutFacture {
  en_attente
  payee
  en_retard
  annulee
}

model Facture {
  id                String        @id @default(cuid())
  numero            String        @unique // Format: F-2026-001
  montant           Float
  devise            String        @default("EUR")
  statut            StatutFacture @default(en_attente)
  
  dossierId         String
  dossier           Dossier       @relation(fields: [dossierId], references: [id])
  
  tenantId          String
  tenant            Tenant        @relation(fields: [tenantId], references: [id])
  
  dateEmission      DateTime      @default(now())
  dateEcheance      DateTime
  datePaiement      DateTime?
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
}

model RendezVous {
  id                String   @id @default(cuid())
  titre             String
  description       String?
  dateHeure         DateTime
  duree             Int      // en minutes
  lieu              String?
  
  dossierId         String?
  dossier           Dossier? @relation(fields: [dossierId], references: [id])
  
  tenantId          String
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TypeDocument {
  recours
  decision
  piece_identite
  justificatif
  autre
}

model Document {
  id                String       @id @default(cuid())
  nom               String
  type              TypeDocument @default(autre)
  cheminFichier     String
  taille            Int          // en bytes
  
  dossierId         String
  dossier           Dossier      @relation(fields: [dossierId], references: [id])
  
  tenantId          String
  tenant            Tenant       @relation(fields: [tenantId], references: [id])
  
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
}
```

---

## 🌱 SEED COMPLET

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // ============================================
  // 1. PLANS
  // ============================================
  const planBasic = await prisma.plan.upsert({
    where: { nom: 'Basic' },
    update: {},
    create: {
      nom: 'Basic',
      prix: 49,
      maxClients: 10,
      maxDossiers: 50,
      aiAutonomyLevel: 1, // Assistant simple
    },
  });

  const planPremium = await prisma.plan.upsert({
    where: { nom: 'Premium' },
    update: {},
    create: {
      nom: 'Premium',
      prix: 149,
      maxClients: 50,
      maxDossiers: 200,
      aiAutonomyLevel: 2, // Pré-rédaction
    },
  });

  const planEnterprise = await prisma.plan.upsert({
    where: { nom: 'Enterprise' },
    update: {},
    create: {
      nom: 'Enterprise',
      prix: 499,
      maxClients: 999999,
      maxDossiers: 999999,
      aiAutonomyLevel: 3, // Analyse juridique
    },
  });

  // ============================================
  // 2. SUPER ADMIN
  // ============================================
  const hashedPasswordAdmin = await bcrypt.hash('Admin123!', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@iapostemanager.com' },
    update: {},
    create: {
      email: 'admin@iapostemanager.com',
      password: hashedPasswordAdmin,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // ============================================
  // 3. TENANTS (3 Cabinets)
  // ============================================
  
  // Cabinet Dupont - Basic
  const tenantDupont = await prisma.tenant.upsert({
    where: { email: 'contact@cabinet-dupont.fr' },
    update: {},
    create: {
      nom: 'Cabinet Dupont',
      email: 'contact@cabinet-dupont.fr',
      telephone: '01 23 45 67 89',
      adresse: '12 Rue de la Paix, 75001 Paris',
      planId: planBasic.id,
      clientCount: 2,
      dossierCount: 2,
    },
  });

  // Cabinet Martin - Premium
  const tenantMartin = await prisma.tenant.upsert({
    where: { email: 'contact@cabinet-martin.fr' },
    update: {},
    create: {
      nom: 'Cabinet Martin & Associés',
      email: 'contact@cabinet-martin.fr',
      telephone: '01 98 76 54 32',
      adresse: '45 Avenue Montaigne, 75008 Paris',
      planId: planPremium.id,
      clientCount: 2,
      dossierCount: 2,
    },
  });

  // Cabinet Rousseau - Enterprise
  const tenantRousseau = await prisma.tenant.upsert({
    where: { email: 'contact@cabinet-rousseau.fr' },
    update: {},
    create: {
      nom: 'Cabinet Rousseau International',
      email: 'contact@cabinet-rousseau.fr',
      telephone: '01 11 22 33 44',
      adresse: '78 Boulevard Haussmann, 75009 Paris',
      planId: planEnterprise.id,
      clientCount: 2,
      dossierCount: 2,
    },
  });

  // ============================================
  // 4. AVOCATS (ADMIN par tenant)
  // ============================================
  const hashedPasswordLawyer = await bcrypt.hash('Avocat123!', 10);

  const avocatDupont = await prisma.user.upsert({
    where: { email: 'marie.dupont@cabinet-dupont.fr' },
    update: {},
    create: {
      email: 'marie.dupont@cabinet-dupont.fr',
      password: hashedPasswordLawyer,
      name: 'Marie Dupont',
      role: 'ADMIN',
      tenantId: tenantDupont.id,
    },
  });

  const avocatMartin = await prisma.user.upsert({
    where: { email: 'pierre.martin@cabinet-martin.fr' },
    update: {},
    create: {
      email: 'pierre.martin@cabinet-martin.fr',
      password: hashedPasswordLawyer,
      name: 'Pierre Martin',
      role: 'ADMIN',
      tenantId: tenantMartin.id,
    },
  });

  const avocatRousseau = await prisma.user.upsert({
    where: { email: 'sophie.rousseau@cabinet-rousseau.fr' },
    update: {},
    create: {
      email: 'sophie.rousseau@cabinet-rousseau.fr',
      password: hashedPasswordLawyer,
      name: 'Sophie Rousseau',
      role: 'ADMIN',
      tenantId: tenantRousseau.id,
    },
  });

  // ============================================
  // 5. CLIENTS (2 par tenant)
  // ============================================
  const hashedPasswordClient = await bcrypt.hash('Client123!', 10);

  // Clients Dupont
  const clientDupont1 = await prisma.client.create({
    data: {
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      telephone: '06 11 22 33 44',
      nationalite: 'Britannique',
      tenantId: tenantDupont.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: hashedPasswordClient,
      name: 'John Doe',
      role: 'CLIENT',
      tenantId: tenantDupont.id,
      clientId: clientDupont1.id,
    },
  });

  const clientDupont2 = await prisma.client.create({
    data: {
      nom: 'Smith',
      prenom: 'Jane',
      email: 'jane.smith@example.com',
      telephone: '06 22 33 44 55',
      nationalite: 'Américaine',
      tenantId: tenantDupont.id,
    },
  });

  // Clients Martin
  const clientMartin1 = await prisma.client.create({
    data: {
      nom: 'Garcia',
      prenom: 'Carlos',
      email: 'carlos.garcia@example.com',
      telephone: '06 33 44 55 66',
      nationalite: 'Espagnole',
      tenantId: tenantMartin.id,
    },
  });

  const clientMartin2 = await prisma.client.create({
    data: {
      nom: 'Rossi',
      prenom: 'Maria',
      email: 'maria.rossi@example.com',
      telephone: '06 44 55 66 77',
      nationalite: 'Italienne',
      tenantId: tenantMartin.id,
    },
  });

  // Clients Rousseau
  const clientRousseau1 = await prisma.client.create({
    data: {
      nom: 'Chen',
      prenom: 'Li',
      email: 'li.chen@example.com',
      telephone: '06 55 66 77 88',
      nationalite: 'Chinoise',
      tenantId: tenantRousseau.id,
    },
  });

  const clientRousseau2 = await prisma.client.create({
    data: {
      nom: 'Ahmed',
      prenom: 'Fatima',
      email: 'fatima.ahmed@example.com',
      telephone: '06 66 77 88 99',
      nationalite: 'Marocaine',
      tenantId: tenantRousseau.id,
    },
  });

  // ============================================
  // 6. DOSSIERS (2 par tenant)
  // ============================================
  
  // Dossiers Dupont
  const dossierDupont1 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-001',
      typeDossier: 'Recours OQTF',
      objet: 'Recours contre OQTF notifiée le 15/12/2025',
      statut: 'urgent',
      clientId: clientDupont1.id,
      tenantId: tenantDupont.id,
      dateEcheance: new Date('2026-02-28'),
    },
  });

  const dossierDupont2 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-002',
      typeDossier: 'Titre de séjour',
      objet: 'Renouvellement titre de séjour salarié',
      statut: 'en_cours',
      clientId: clientDupont2.id,
      tenantId: tenantDupont.id,
      dateEcheance: new Date('2026-03-15'),
    },
  });

  // Dossiers Martin
  const dossierMartin1 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-003',
      typeDossier: 'Naturalisation',
      objet: 'Demande de naturalisation par mariage',
      statut: 'en_cours',
      clientId: clientMartin1.id,
      tenantId: tenantMartin.id,
      dateEcheance: new Date('2026-06-01'),
    },
  });

  const dossierMartin2 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-004',
      typeDossier: 'Regroupement familial',
      objet: 'Regroupement familial conjoint + 2 enfants',
      statut: 'en_cours',
      clientId: clientMartin2.id,
      tenantId: tenantMartin.id,
      dateEcheance: new Date('2026-04-20'),
    },
  });

  // Dossiers Rousseau
  const dossierRousseau1 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-005',
      typeDossier: 'Visa long séjour',
      objet: 'Visa long séjour entrepreneur/profession libérale',
      statut: 'en_cours',
      clientId: clientRousseau1.id,
      tenantId: tenantRousseau.id,
      dateEcheance: new Date('2026-05-10'),
    },
  });

  const dossierRousseau2 = await prisma.dossier.create({
    data: {
      numero: 'D-2026-006',
      typeDossier: 'Asile',
      objet: 'Demande d\'asile politique',
      statut: 'urgent',
      clientId: clientRousseau2.id,
      tenantId: tenantRousseau.id,
      dateEcheance: new Date('2026-02-15'),
    },
  });

  // ============================================
  // 7. FACTURES
  // ============================================
  
  await prisma.facture.create({
    data: {
      numero: 'F-2026-001',
      montant: 1500,
      statut: 'payee',
      dossierId: dossierDupont1.id,
      tenantId: tenantDupont.id,
      dateEcheance: new Date('2026-01-31'),
      datePaiement: new Date('2026-01-25'),
    },
  });

  await prisma.facture.create({
    data: {
      numero: 'F-2026-002',
      montant: 2500,
      statut: 'en_attente',
      dossierId: dossierMartin1.id,
      tenantId: tenantMartin.id,
      dateEcheance: new Date('2026-02-28'),
    },
  });

  await prisma.facture.create({
    data: {
      numero: 'F-2026-003',
      montant: 3500,
      statut: 'en_attente',
      dossierId: dossierRousseau1.id,
      tenantId: tenantRousseau.id,
      dateEcheance: new Date('2026-03-15'),
    },
  });

  console.log('✅ Seeding terminé avec succès !');
  console.log(`📊 Super Admin: admin@iapostemanager.com / Admin123!`);
  console.log(`👨‍⚖️ Avocats: *@cabinet-*.fr / Avocat123!`);
  console.log(`👤 Clients: john.doe@example.com / Client123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🛠️ BIBLIOTHÈQUE PLAN LIMITS

```typescript
// src/lib/planLimits.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Actions IA selon Charte IA
 */
export enum AIAction {
  SIMPLE_QUERY = 1,           // Niveau 1 : Recherche simple
  PRE_DRAFT = 2,              // Niveau 2 : Pré-rédaction
  LEGAL_ANALYSIS = 3,         // Niveau 3 : Analyse juridique
  AUTONOMOUS_FILING = 4,      // Niveau 4 : Dépôt autonome (INTERDIT sauf Enterprise avec validation)
}

/**
 * Vérifie si un tenant peut créer un nouveau dossier
 */
export async function canCreateDossier(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant non trouvé' };
  }

  if (tenant.dossierCount >= tenant.plan.maxDossiers) {
    return {
      allowed: false,
      reason: `Limite atteinte : ${tenant.plan.maxDossiers} dossiers max (Plan ${tenant.plan.nom})`,
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si un tenant peut ajouter un nouveau client
 */
export async function canAddClient(tenantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant non trouvé' };
  }

  if (tenant.clientCount >= tenant.plan.maxClients) {
    return {
      allowed: false,
      reason: `Limite atteinte : ${tenant.plan.maxClients} clients max (Plan ${tenant.plan.nom})`,
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si une action IA est autorisée selon le plan
 */
export async function canPerformAIAction(tenantId: string, action: AIAction): Promise<{ allowed: boolean; reason?: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) {
    return { allowed: false, reason: 'Tenant non trouvé' };
  }

  const aiLevel = tenant.plan.aiAutonomyLevel;

  if (action > aiLevel) {
    return {
      allowed: false,
      reason: `Action IA niveau ${action} non autorisée. Votre plan ${tenant.plan.nom} autorise jusqu'au niveau ${aiLevel}.`,
    };
  }

  // GARDE-FOU CRITIQUE : Actions niveau 4 (dépôt autonome) requièrent TOUJOURS validation humaine
  if (action === AIAction.AUTONOMOUS_FILING) {
    return {
      allowed: true,
      reason: '⚠️ VALIDATION HUMAINE OBLIGATOIRE : Cette action requiert impérativement une vérification par un avocat avant exécution.',
    };
  }

  return { allowed: true };
}

/**
 * Incrémente le compteur de dossiers d'un tenant
 */
export async function incrementDossierCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { dossierCount: { increment: 1 } },
  });
}

/**
 * Incrémente le compteur de clients d'un tenant
 */
export async function incrementClientCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { clientCount: { increment: 1 } },
  });
}

/**
 * Décrémente le compteur de dossiers (si suppression)
 */
export async function decrementDossierCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { dossierCount: { decrement: 1 } },
  });
}

/**
 * Décrémente le compteur de clients (si suppression)
 */
export async function decrementClientCount(tenantId: string): Promise<void> {
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { clientCount: { decrement: 1 } },
  });
}
```

---

## 🔐 PATTERNS API ROUTES

### Super Admin - Gestion Tenants

```typescript
// src/app/api/super-admin/tenants/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const tenants = await prisma.tenant.findMany({
    include: {
      plan: true,
      _count: {
        select: {
          clients: true,
          dossiers: true,
          factures: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json();
  const { nom, email, telephone, adresse, planId } = body;

  if (!nom || !email || !planId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  const newTenant = await prisma.tenant.create({
    data: {
      nom,
      email,
      telephone,
      adresse,
      planId,
    },
    include: { plan: true },
  });

  return NextResponse.json({ tenant: newTenant }, { status: 201 });
}
```

### Admin - Création Dossier avec Limites

```typescript
// src/app/api/admin/dossiers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import { canCreateDossier, incrementDossierCount } from '@/lib/planLimits';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === 'CLIENT') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const tenantId = session.user.tenantId;

  const dossiers = await prisma.dossier.findMany({
    where: { tenantId },
    include: {
      client: true,
      _count: {
        select: { documents: true, factures: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ dossiers });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const tenantId = session.user.tenantId;

  // VÉRIFICATION LIMITE PLAN
  const check = await canCreateDossier(tenantId);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason }, { status: 403 });
  }

  const body = await request.json();
  const { typeDossier, objet, clientId, dateEcheance, statut } = body;

  if (!typeDossier || !objet || !clientId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
  }

  // Auto-numérotation
  const lastDossier = await prisma.dossier.findFirst({
    where: { tenantId },
    orderBy: { numero: 'desc' },
  });

  let nextNumber = 1;
  if (lastDossier) {
    const match = lastDossier.numero.match(/D-\d+-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const numero = `D-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;

  const newDossier = await prisma.dossier.create({
    data: {
      numero,
      typeDossier,
      objet,
      clientId,
      tenantId,
      statut: statut || 'brouillon',
      dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
    },
    include: { client: true },
  });

  // INCRÉMENTER COMPTEUR
  await incrementDossierCount(tenantId);

  return NextResponse.json({ dossier: newDossier }, { status: 201 });
}
```

### Client - Lecture Seule

```typescript
// src/app/api/client/my-dossiers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const clientId = session.user.clientId;

  if (!clientId) {
    return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 });
  }

  const dossiers = await prisma.dossier.findMany({
    where: { clientId },
    include: {
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ dossiers });
}
```

---

## 🎨 UI PATTERNS

### Dashboard Cards avec Usage

```tsx
<div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-sm font-medium text-gray-500">Clients</h3>
      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.clients}</p>
      <p className="text-xs text-gray-500 mt-1">sur {stats.clientsLimit} max</p>
    </div>
    <div className="bg-blue-100 p-3 rounded-full">
      <span className="text-3xl">👥</span>
    </div>
  </div>
  <div className="mt-3">
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${
          usageClientPct >= 90 ? 'bg-red-500' :
          usageClientPct >= 70 ? 'bg-orange-500' :
          'bg-blue-500'
        }`}
        style={{ width: `${Math.min(usageClientPct, 100)}%` }}
      ></div>
    </div>
  </div>
</div>
```

---

## 📝 CHECKLISTS

### Pour Créer une Nouvelle Route API

1. ✅ Vérifier la session avec `getServerSession`
2. ✅ Vérifier le rôle (SUPER_ADMIN / ADMIN / CLIENT)
3. ✅ Extraire `tenantId` de la session (sauf Super Admin)
4. ✅ Vérifier les limites plan avec `canCreate...()` si création
5. ✅ Effectuer l'opération Prisma avec filtrage `where: { tenantId }`
6. ✅ Incrémenter les compteurs avec `increment...Count()`
7. ✅ Retourner JSON avec gestion d'erreurs

### Pour Créer un Dashboard

1. ✅ Utiliser `useSession` pour récupérer session
2. ✅ Rediriger selon rôle (useEffect + router.push)
3. ✅ Fetcher les données depuis API routes
4. ✅ Afficher stats avec progress bars (usage limites)
5. ✅ Gradients cohérents : `bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50`
6. ✅ Cartes stats avec border-l-4 et icônes emoji
7. ✅ Loading state avec spinner

---

## 🚀 COMMANDES UTILES

```bash
# Setup initial
npm install
npx prisma generate
npx prisma db push
npx prisma db seed

# Développement
npm run dev

# Reset DB
npx prisma migrate reset --force

# Voir la DB
npx prisma studio
```

---

## 🎯 RÈGLES D'OR

1. **TOUJOURS filtrer par tenantId** sauf pour Super Admin
2. **TOUJOURS vérifier les limites plan** avant création
3. **TOUJOURS incrémenter les compteurs** après création
4. **JAMAIS permettre l'IA de décider seule** sur actes critiques (Charte IA)
5. **TOUJOURS valider les rôles** dans les routes API
6. **TOUJOURS utiliser bcrypt** pour les mots de passe
7. **TOUJOURS inclure des relations** dans les Prisma queries pour perf

---

Ce prompt contient TOUT le contexte nécessaire pour générer du code cohérent avec l'architecture IA Poste Manager. Utilisez-le pour générer routes, dashboards, composants en respectant ces patterns établis.
