# 🚀 MemoLib - Plateforme Juridique Intelligente

[![CI/CD Pipeline](https://github.com/mobby57/memoLib/actions/workflows/ci.yml/badge.svg)](https://github.com/mobby57/memoLib/actions/workflows/ci.yml)
[![Deploy](https://github.com/mobby57/memoLib/actions/workflows/deploy.yml/badge.svg)](https://github.com/mobby57/memoLib/actions/workflows/deploy.yml)
[![Security — Semgrep](https://github.com/mobby57/memoLib/actions/workflows/semgrep.yml/badge.svg)](https://github.com/mobby57/memoLib/actions/workflows/semgrep.yml)
[![Trivy Scan](https://github.com/mobby57/memoLib/actions/workflows/trivy.yml/badge.svg)](https://github.com/mobby57/memoLib/actions/workflows/trivy.yml)
[![Tests](https://img.shields.io/badge/tests-4398_passing-brightgreen)](https://github.com/mobby57/memoLib/actions)
[![Coverage](https://img.shields.io/badge/coverage-87%25-brightgreen)](https://github.com/mobby57/memoLib/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black)](https://vercel.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Qu'est-ce que MemoLib ?

**MemoLib** est une plateforme de gestion intelligente pour **cabinets d'avocats**. Elle automatise le workflow complet : réception d'emails, analyse IA, création de dossiers, gestion des deadlines, génération de documents, et conformité RGPD.

### Pour qui ?

- ⚖️ Cabinets d'avocats (1-50 avocats)
- 📜 Notaires, huissiers, experts juridiques
- 🏢 PME juridiques

---

## ✨ Features principales

### 🤖 IA Juridique

- **Résumé automatique d'email** — Détecte client, urgence, type de dossier, deadline
- **Brouillon de réponse** — Génère une réponse contextualisée au dossier
- **Classification automatique** — OQTF, titre de séjour, asile, naturalisation...
- **Recherche jurisprudence** — Interroge Légifrance (CESEDA, jurisprudence)

### 📧 Emails intelligents

- Webhook inbound (Gmail, Outlook, SendGrid)
- Déduplication SHA256
- Analyse IA automatique à la réception
- **Email → Dossier en 1 clic** (le wow moment)

### 📁 Dossiers

- Workflow de statut complet
- Timeline automatique (emails + documents + deadlines)
- Attribution à des avocats
- Tags, priorités, échéances

### 📄 Génération de documents

- 6 templates juridiques : accusé de réception, mise en demeure, recours gracieux, recours contentieux, convocation, attestation
- Variables auto-remplies depuis le dossier
- Édition + téléchargement

### ⏰ Délais légaux

- Alertes automatiques J-7, J-3, J-1
- Widget dashboard avec code couleur
- Détection IA des deadlines dans les emails

### 🔐 Sécurité & Conformité

- RBAC 9 rôles (SUPER_ADMIN → CLIENT)
- Multi-tenant par cabinet
- RGPD : anonymisation, droit à l'oubli, audit trail chaîné (hash chain)
- Rate limiting (Upstash Redis + fallback)
- Brute force protection
- Scan antivirus sur uploads (ClamAV + signatures)

### 🚀 Onboarding

- Wizard interactif pour les nouveaux utilisateurs
- Détection automatique de la progression
- Guide pas-à-pas : client → email → dossier

---

## 🛠️ Stack Technique

| Composant       | Technologie                                      |
| --------------- | ------------------------------------------------ |
| Frontend        | Next.js 16, React 19, TypeScript, Tailwind CSS   |
| Backend API     | ASP.NET Core 9.0, Entity Framework Core          |
| Base de données | PostgreSQL (prod) / SQLite (dev)                 |
| ORM Frontend    | Prisma 5                                         |
| Auth            | NextAuth (Credentials, Google, GitHub, Azure AD) |
| IA              | Ollama (local) + fallback regex                  |
| Email           | MailKit (IMAP/SMTP), webhook inbound             |
| Paiements       | Stripe (subscriptions + usage)                   |
| Monitoring      | Sentry (server + client + replay)                |
| CI/CD           | GitHub Actions (13 workflows)                    |
| Déploiement     | Vercel (frontend) + Docker (backend)             |

---

## 🛡️ Engineering Excellence

| Pratique              | Détail                                                           |
| --------------------- | ---------------------------------------------------------------- |
| **CI/CD**             | 19 workflows GitHub Actions (build, test, deploy, security)      |
| **Quality Gate**      | Aucun merge sans tests verts + review                            |
| **Tests**             | 4398 tests (Jest + xUnit + Playwright E2E) — 87% coverage        |
| **Security Scanning** | Semgrep SAST, Trivy containers, TruffleHog secrets, CodeQL, Snyk |
| **Environments**      | Preview → Staging → Production                                   |
| **Semantic Release**  | Versioning automatique + changelog                               |
| **Dependency Review** | Dependabot + audit automatique                                   |
| **Monitoring**        | Sentry (errors + performance + session replay)                   |
| **RGPD**              | Audit trail chaîné (hash chain), anonymisation, droit à l'oubli  |
| **Antivirus**         | Scan ClamAV sur chaque upload                                    |
| **Rate Limiting**     | Upstash Redis + brute force protection                           |
| **RBAC**              | 9 rôles, permissions granulaires, multi-tenant                   |

---

## 📦 Installation

### Prérequis

- Node.js 20+ et npm
- .NET 9.0 SDK
- PostgreSQL (ou SQLite en local)

### Frontend (Next.js)

```powershell
git clone https://github.com/mobby57/memoLib.git
cd memoLib
npm install
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
npx prisma generate
npx prisma migrate deploy
npm run dev
```

**Accès :** http://localhost:3000

### Backend .NET

```powershell
dotnet restore
dotnet ef database update
dotnet run
```

**Accès API :** http://localhost:5078

---

## 🧪 Tests

### Tests unitaires + intégration (Vitest)

```powershell
npx vitest run
```

Couvre : RBAC, email adapter, deadlines, documents, facturation, Légifrance.

### Tests .NET (xUnit)

```powershell
dotnet test tests/MemoLib.Tests.csproj
```

Couvre : brute force, password, billing, GDPR, email monitor, export.

### Tests E2E (Playwright)

```powershell
npx playwright test tests/e2e/main-flow.spec.ts
```

Couvre le flow complet :

1. Login → Dashboard
2. Résumé IA d'un email (vérifie urgence, type, client, deadline)
3. Création dossier depuis email en 1 clic
4. Génération de document juridique
5. Brouillon de réponse IA
6. Recherche jurisprudence
7. Landing page + inscription beta

### TypeScript check

```powershell
npx tsc --noEmit
```

### Tous les tests

```powershell
# Frontend
npx vitest run

# Backend
dotnet test tests/MemoLib.Tests.csproj

# Type check
npx tsc --noEmit

# E2E (nécessite l'app en cours d'exécution)
npx playwright test
```

---

## 📊 API Endpoints principaux

### IA

```
POST /api/ai/summarize-email     # Résumé structuré d'un email
POST /api/ai/draft-reply         # Brouillon de réponse contextualisé
```

### Dossiers

```
POST /api/emails/create-dossier  # Email → Dossier en 1 clic
GET  /api/dossiers/timeline      # Timeline automatique d'un dossier
```

### Documents

```
POST /api/documents/generate     # Génération courrier juridique
GET  /api/documents/generate     # Liste des templates disponibles
POST /api/documents/upload       # Upload document sécurisé
```

### Jurisprudence

```
GET  /api/jurisprudence/search?q=OQTF  # Recherche Légifrance
```

### Webhooks

```
POST /api/webhooks/email-inbound  # Réception email (Gmail/Outlook/SendGrid)
POST /api/webhooks/stripe         # Paiements Stripe
```

### Auth

```
POST /api/auth/[...nextauth]     # NextAuth (login, register, OAuth)
GET  /api/onboarding/status      # Statut onboarding utilisateur
```

### Cron

```
GET /api/cron/deadline-alerts    # Alertes échéances (quotidien)
GET /api/cron/cost-alerts        # Alertes coûts (quotidien)
```

---

## 📁 Structure du Projet

```
MemoLib/
├── src/                      # Frontend Next.js
│   ├── app/                  # App Router (pages + API routes)
│   ├── components/           # Composants React
│   │   ├── emails/           # EmailAISummary, DraftReplyEditor
│   │   ├── dossiers/         # DossierTimeline
│   │   ├── documents/        # DocumentGenerator
│   │   ├── dashboard/        # DeadlineAlerts
│   │   ├── onboarding/       # OnboardingWizard
│   │   └── forms/            # FormField, FormLayout, Button
│   ├── lib/                  # Utilitaires, Prisma, auth, billing, IA
│   └── hooks/                # React hooks (useAuth, useRealtime)
├── prisma/                   # Schéma Prisma + migrations
├── Controllers/              # API .NET (68 controllers)
├── Services/                 # Logique métier .NET (63+ services)
├── Models/                   # Entités .NET
├── tests/                    # Tests (Vitest, xUnit, Playwright)
├── scripts/                  # Scripts utilitaires
├── docs/                     # Documentation technique
├── docker-compose.yml        # Docker backend
└── vercel.json               # Config Vercel
```

---

## ⚙️ Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/memolib"

# Auth
NEXTAUTH_SECRET="votre-secret"
NEXTAUTH_URL="http://localhost:3000"

# IA (optionnel — fallback regex si absent)
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:latest"

# Jurisprudence (optionnel — fallback local si absent)
PISTE_CLIENT_ID=""
PISTE_CLIENT_SECRET=""

# Webhook email (optionnel)
EMAIL_WEBHOOK_SECRET="votre-secret-webhook"

# Stripe (optionnel)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Monitoring (optionnel)
SENTRY_DSN=""

# ClamAV antivirus (optionnel)
CLAMAV_HOST="localhost"
CLAMAV_PORT="3310"
```

---

## 🚀 Déploiement

### Frontend → Vercel

```powershell
npm run deploy:vercel
```

### Backend → Docker

```powershell
docker-compose up -d
```

---

## 📈 Roadmap

### ✅ Livré

- [x] Multi-tenant RBAC complet (9 rôles)
- [x] Gestion dossiers + clients + emails
- [x] IA : résumé email, brouillon réponse, classification
- [x] Email → Dossier en 1 clic
- [x] Timeline automatique
- [x] Génération documents juridiques (6 templates)
- [x] Recherche jurisprudence (Légifrance)
- [x] Webhook email inbound (Gmail/Outlook/SendGrid)
- [x] Facturation Stripe + usage billing
- [x] Délais légaux avec alertes J-7/J-3/J-1
- [x] Onboarding wizard
- [x] Landing page beta
- [x] Conformité RGPD + audit trail chaîné
- [x] CI/CD (13 workflows GitHub Actions)
- [x] Tests (Vitest + xUnit + Playwright)

### 🚧 En cours

- [ ] Plugin Gmail / Outlook natif
- [ ] OCR avancé sur documents
- [ ] Agents IA autonomes (suivi procédure)

### 💡 Futur

- [ ] Application mobile (React Native)
- [ ] Marketplace d'intégrations
- [ ] Transcription audio (audiences)
- [ ] Collaboration inter-cabinets

---

## 📝 Licence

MIT License

## 📞 Support

- 📚 Documentation : `docs/`
- 🐛 Issues : [GitHub Issues](https://github.com/mobby57/memoLib/issues)
