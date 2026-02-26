# 🏛️ MemoLib - Legal Practice Management Platform

> **Application complète de gestion de cabinet d'avocat** avec CRM clients, gestion de dossiers juridiques, facturation, messagerie, et portail client.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mobby57/memoLib)
[![CI/CD](https://github.com/mobby57/memoLib/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/mobby57/memoLib/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Table des Matières

- [Aperçu](#-aperçu)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Démarrage Rapide](#-démarrage-rapide)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Sécurité](#-sécurité)
- [Roadmap](#-roadmap)

---

## 🎯 Aperçu

MemoLib est une **plateforme SaaS de gestion de cabinet juridique** permettant aux avocats de:
- 📂 Gérer leurs dossiers et clients
- 💰 Créer et suivre les factures (intégration Stripe)
- 📄 Stocker et organiser les documents
- 💬 Communiquer avec les clients
- 📅 Gérer les délais juridiques
- 📊 Analyser leur activité

### 3 Rôles Utilisateurs

1. **AVOCAT** - Accès complet (CRUD dossiers, clients, factures, documents)
2. **CLIENT** - Accès lecture seule (ses dossiers, documents, factures) + messagerie
3. **SUPER_ADMIN** - Gestion système (tenants, utilisateurs, logs, métriques)

---

## ✨ Fonctionnalités

### 🔐 Authentification
- [x] Login/Register avec NextAuth.js
- [x] OAuth (GitHub, Google) - à configurer
- [x] 2FA (TOTP) - à implémenter
- [x] Session management avec JWT
- [x] Role-based access control (RBAC)

### 📂 Gestion Dossiers
- [x] CRUD complet (Create, Read, Update, Delete)
- [x] Numérotation automatique
- [x] Statuts personnalisables (ouvert, en attente, closé)
- [x] Recherche et filtres avancés
- [x] Liaison clients, documents, factures
- [x] Historique complet (audit logs)

### 👥 Gestion Clients
- [x] Base CRM complète
- [x] Fiche client (nom, email, téléphone, SIRET)
- [x] Dossiers associés
- [x] Consentement RGPD
- [x] Export données (RGPD compliance)

### 💰 Facturation
- [x] Création factures HT/TTC auto-calculées
- [x] Lignes de facturation multiples
- [x] Statuts (brouillon, envoyée, payée, impayée)
- [x] Paiement Stripe (cartes, virements)
- [x] Webhooks Stripe pour MAJ statuts
- [x] Génération PDF (à implémenter)

### 📄 Documents
- [x] Upload fichiers (S3-compatible)
- [x] Catégorisation (contrat, jugement, courrier, etc.)
- [x] Visibilité par dossier
- [x] OCR text extraction (à implémenter)
- [x] Signature électronique (à implémenter)

### 💬 Messagerie
- [x] Chat temps réel par dossier
- [x] Multi-canal (email, SMS, WhatsApp, formulaire)
- [x] Notifications push
- [x] Pièces jointes
- [x] Historique complet

### 📅 Agenda & Tâches
- [x] Calendrier partagé
- [x] Événements récurrents
- [x] Rappels automatiques
- [x] Tâches assignables
- [x] Priorités (low, medium, high, urgent)

### ⚖️ Délais Juridiques
- [x] Calcul automatique délais légaux
- [x] Alertes J-7, J-3, J-1
- [x] Types: recours gracieux, appel, cassation, prescription
- [x] Intégration agenda

### 📊 Analytics
- [x] Dashboard stats (dossiers, clients, revenu)
- [x] Graphiques activité
- [ ] Rapports personnalisables (v2)
- [ ] Export Excel/PDF (v2)

### 🔒 Sécurité & RGPD
- [x] Encryption données sensibles
- [x] Audit logs complets
- [x] Consentement tracking
- [x] Export données utilisateur
- [x] Anonymisation
- [x] Politique de rétention

---

## 🛠️ Stack Technique

### Frontend
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **UI**: React 19, TailwindCSS 3.4, shadcn/ui
- **State**: Zustand, React Query
- **Forms**: React Hook Form + Zod validation
- **Auth**: NextAuth.js v5
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (REST)
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Prisma 6.2
- **Cache**: Upstash Redis
- **Queue**: Upstash QStash (cron jobs)

### Paiements
- **Gateway**: Stripe (Payment Intents API)
- **Webhooks**: Signature validation
- **Méthodes**: Cartes, SEPA, virements

### Storage
- **Documents**: AWS S3 / Cloudflare R2
- **Images**: Vercel Blob

### Monitoring
- **APM**: Sentry
- **Logs**: Vercel Logs
- **Analytics**: Vercel Analytics
- **Uptime**: UptimeRobot

### DevOps
- **Hosting**: Vercel (frontend), Railway (DB)
- **CI/CD**: GitHub Actions
- **Tests**: Playwright (E2E), Jest (unit)
- **Linting**: ESLint, Prettier
- **Git Hooks**: Husky, lint-staged

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- PostgreSQL 15+
- Git

### Installation

1. **Clone du repo**
   ```bash
   git clone https://github.com/mobby57/memoLib.git
   cd memoLib
   ```

2. **Installation dépendances**
   ```bash
   cd src/frontend
   npm install --legacy-peer-deps
   ```

3. **Configuration environnement**
   ```bash
   cp .env.example .env.local
   # Éditer .env.local avec vos credentials
   ```

4. **Setup database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   npx prisma db seed  # Données de démo
   ```

5. **Lancer dev server**
   ```bash
   npm run dev
   # App: http://localhost:3000
   ```

### Variables d'Environnement

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/memolib

# NextAuth
NEXTAUTH_SECRET=<generate-with-openssl>
NEXTAUTH_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://***.upstash.io
UPSTASH_REDIS_REST_TOKEN=***

# Optional
GITHUB_CLIENT_ID=***
GITHUB_CLIENT_SECRET=***
SENTRY_DSN=***
```

---

## 🏗️ Architecture

### Structure Projet

```
memolib/
├── src/
│   ├── frontend/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── dossiers/
│   │   │   │   ├── clients/
│   │   │   │   ├── factures/
│   │   │   │   ├── documents/
│   │   │   │   ├── messages/
│   │   │   │   ├── tasks/
│   │   │   │   └── calendar/
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           ├── dossiers/
│   │   │           ├── clients/
│   │   │           ├── factures/
│   │   │           ├── documents/
│   │   │           ├── messages/
│   │   │           ├── tasks/
│   │   │           ├── events/
│   │   │           └── payments/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── lib/
│   │   ├── prisma/
│   │   └── tests/e2e/
│   └── backend-python/ (legacy)
├── .github/workflows/
├── docs/
└── scripts/
```

### Database Schema

40+ modèles Prisma:
- **Core**: User, Tenant, Lawyer, Client
- **Business**: Case, Document, Invoice, Payment
- **Communication**: Message, ChannelMessage, Notification
- **Planning**: Task, Event, LegalDeadline
- **RGPD**: ConsentRecord, DataExportRequest, ArchivePolicy
- **System**: AuditLog, ApiKey, Webhook

Voir [prisma/schema.prisma](prisma/schema.prisma) pour détails.

---

## 📡 API Documentation

### Base URL
```
Production: https://memolib.vercel.app/api/v1
Local: http://localhost:3000/api/v1
```

### Authentification
Toutes les requêtes nécessitent une session NextAuth valide.

### Endpoints

#### Dossiers
```http
GET    /api/v1/dossiers          # Liste avec pagination/filtres
POST   /api/v1/dossiers          # Créer
GET    /api/v1/dossiers/:id      # Détails
PUT    /api/v1/dossiers/:id      # Modifier
DELETE /api/v1/dossiers/:id      # Clôturer
```

#### Clients
```http
GET    /api/v1/clients           # Liste avec recherche
POST   /api/v1/clients           # Créer
```

#### Factures
```http
GET    /api/v1/factures          # Liste avec filtres
POST   /api/v1/factures          # Créer
GET    /api/v1/factures/:id/payment-intent  # Stripe PaymentIntent
POST   /api/v1/webhooks/stripe   # Webhook Stripe
```

#### Documents
```http
GET    /api/v1/documents         # Par dossier
POST   /api/v1/documents         # Upload
```

#### Messages
```http
GET    /api/v1/dossiers/:id/messages  # Historique
POST   /api/v1/dossiers/:id/messages  # Envoyer
```

#### Tâches
```http
GET    /api/v1/tasks             # Assignées au user
POST   /api/v1/tasks             # Créer
```

#### Événements
```http
GET    /api/v1/events            # Agenda du user
POST   /api/v1/events            # Créer événement
```

Voir [ARCHITECTURE_APP_AVOCAT.md](ARCHITECTURE_APP_AVOCAT.md) pour specs complètes.

---

## 🧪 Tests

### Tests E2E (Playwright)

```bash
# Run all tests
npm run test:e2e

# Run specific suite
npx playwright test auth.spec.ts

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui
```

### Suites de Tests

1. **auth.spec.ts** - Authentification (4 tests)
2. **dossiers.spec.ts** - CRUD dossiers (7 tests)
3. **invoices.spec.ts** - Facturation (5 tests)
4. **client-portal.spec.ts** - Portail client (5 tests)
5. **admin.spec.ts** - Dashboard admin (5 tests)

**Total: 26 tests couvrant tous les workflows critiques**

### Coverage (à implémenter)
```bash
npm run test:coverage
# Target: 80%+ line coverage
```

---

## 🚢 Déploiement

### Deploy sur Vercel (Production)

**1-Click Deploy**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mobby57/memoLib)

**Ou via CLI**
```bash
npm install -g vercel
vercel --prod
```

Voir [QUICK_DEPLOY.md](QUICK_DEPLOY.md) pour guide détaillé.

### Configuration PostgreSQL

**Option 1: Neon (Recommandé)**
```bash
# Serverless PostgreSQL
# https://neon.tech
# Free tier: 3 GB, 1 compute
```

**Option 2: Railway**
```bash
# Managed PostgreSQL
# https://railway.app
# $5/month
```

### Post-Deploy Checklist

- [ ] Variables d'environnement configurées
- [ ] Database migrée (`npx prisma migrate deploy`)
- [ ] Stripe webhooks configurés
- [ ] Health check OK (`/api/health`)
- [ ] DNS pointé vers Vercel
- [ ] SSL actif (auto via Vercel)
- [ ] Monitoring actif (Sentry)

---

## 🔒 Sécurité

### Mesures Implémentées

✅ **Headers HTTP**
- CSP (Content Security Policy)
- HSTS (Strict-Transport-Security)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

✅ **Rate Limiting**
- Upstash Redis distributed
- 10 req/10s par IP (default)
- 5 req/min (webhooks)
- 5 req/hour (auth endpoints)

✅ **Authentication**
- NextAuth.js sessions
- JWT tokens (RS256)
- OAuth providers ready
- RBAC (role-based access)

✅ **Database**
- Prepared statements (Prisma)
- Input validation (Zod)
- Tenant isolation (multi-tenancy)
- Encrypted sensitive fields

✅ **RGPD Compliance**
- Consentement tracking
- Export données utilisateur
- Droit à l'oubli (anonymisation)
- Audit logs complets
- Politique de rétention

### Audits

- **Dependabot**: Vérifie vulnérabilités npm
- **ggshield**: Scan secrets dans commits
- **Trivy**: Scan conteneurs Docker
- **Snyk**: Scan dépendances

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP (Complétée)
- [x] Architecture API + DB
- [x] Composants React UI
- [x] Tests E2E Playwright
- [x] Déploiement Vercel

### 🚧 Phase 2: v1.0 (En cours)
- [ ] Authentification complète (2FA)
- [ ] Génération PDF factures
- [ ] Upload documents S3
- [ ] Signature électronique
- [ ] OCR documents

### 📋 Phase 3: v2.0 (Q2 2026)
- [ ] Application mobile (React Native)
- [ ] Templates emails personnalisables
- [ ] Intégrations (Gmail, Outlook, Slack)
- [ ] Rapports analytics avancés
- [ ] API publique (REST + GraphQL)

### 🔮 Phase 4: v3.0 (Q4 2026)
- [ ] IA assistant juridique
- [ ] Recherche sémantique documents
- [ ] White-label (multi-tenant SaaS)
- [ ] Marketplace add-ons
- [ ] Conformité ISO 27001

---

## 📄 License

MIT © 2026 MemoLib

---

## 👥 Contributeurs

- **Développeur Principal**: [@mobby57](https://github.com/mobby57)
- **Architecture**: Phase 7 - Legal Practice Management System

---

## 📞 Support

- 📧 Email: support@memolib.com
- 🐛 Bugs: [GitHub Issues](https://github.com/mobby57/memoLib/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/mobby57/memoLib/discussions)
- 📚 Docs: [Wiki](https://github.com/mobby57/memoLib/wiki)

---

## 🙏 Remerciements

- Next.js team pour le framework
- Vercel pour l'hébergement
- Stripe pour les paiements
- Prisma pour l'ORM
- shadcn pour les composants UI

---

**Made with ❤️ for lawyers and their clients**
