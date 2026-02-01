# MemoLib - Assistant de Secrétariat Intelligent

> 🤖 Assistant IA pour cabinets d'avocats, notaires et organisations institutionnelles

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)

---

## 🚀 Quick Start

```bash
# 1. Installation
git clone https://github.com/your-org/memolib.git
cd memolib
npm install

# 2. Configuration
cp .env.example .env.local
# Éditer .env.local avec vos credentials

# 3. Base de données
npm run db

# 4. Lancer le dev
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## ✨ Fonctionnalités

- 📧 **Gestion Emails** - Intégration Microsoft Graph (Outlook)
- 💬 **Messagerie** - WhatsApp, SMS via Twilio
- 📄 **Documents** - Upload, analyse PDF/DOCX, OCR
- 🤖 **IA** - Suggestions intelligentes, catégorisation auto
- 📅 **Calendrier** - Gestion rendez-vous
- 👥 **CRM** - Gestion clients et dossiers
- 💳 **Facturation** - Stripe intégré
- 🔒 **Sécurité** - Azure AD SSO, RGPD compliant

---

## 🏗️ Stack Technique

**Frontend**
- Next.js 16 (App Router, Turbopack)
- React 19 (Server Components)
- TailwindCSS 3.4
- TypeScript 5.9

**Backend**
- Prisma ORM 5.22
- PostgreSQL (prod) / SQLite (dev)
- NextAuth.js (Azure AD)
- Python/Flask (services IA)

**Infrastructure**
- Azure Static Web Apps
- Vercel (alternative)
- Cloudflare Pages (edge)
- Upstash Redis (cache)

---

## 📋 Commandes Essentielles

```bash
# Développement
npm run dev              # Dev avec Turbopack
npm run dev:debug        # Dev avec debugger

# Build & Deploy
npm run build            # Build production
npm run deploy:azure     # Deploy Azure
npm run deploy:vercel    # Deploy Vercel

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run test:coverage    # Coverage report

# Base de données
npm run db               # Push schema + generate
npm run db:migrate       # Migration dev
npm run db:studio        # Prisma Studio UI

# Qualité
npm run validate         # Type-check + lint + test
npm run security         # Audit sécurité

# Maintenance
npm run clean            # Nettoyer cache
npm run fresh            # Clean + install + build
```

---

## 📁 Structure Projet

```
memolib/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Composants React
│   ├── lib/              # Services & utils
│   ├── hooks/            # React hooks
│   └── backend/          # API Python
├── prisma/               # Schémas DB
├── docs/                 # Documentation
├── scripts/              # Scripts utilitaires
└── tests/                # Tests E2E
```

---

## 🔧 Configuration

### Variables d'Environnement

Voir [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) pour la liste complète.

**Minimum requis**:
```bash
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=sqlite:///memolib.db
AZURE_TENANT_ID=<votre-tenant-id>
AZURE_CLIENT_ID=<votre-client-id>
AZURE_CLIENT_SECRET=<votre-secret>
```

### Base de Données

```bash
# Development (SQLite)
npm run db:push

# Production (PostgreSQL)
DATABASE_URL=postgresql://user:pass@host:5432/db
npm run db:migrate:prod
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E (Playwright)
npm run test:e2e

# Coverage
npm run test:coverage

# Tous les tests
npm run test:all
```

---

## 🚀 Déploiement

### Azure Static Web Apps

```bash
npm run build:azure
npm run deploy:azure
```

### Vercel

```bash
npm run deploy:vercel
```

### Cloudflare Pages

```bash
npm run cf:deploy
```

---

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Variables d'Environnement](docs/ENVIRONMENT_VARIABLES.md)
- [Scripts Consolidés](docs/SCRIPTS_CONSOLIDATION.md)
- [Sécurité](docs/SECURITY_CHECKLIST.md)
- [Guide Migration](docs/MIGRATION_GUIDE.md)

---

## 🔒 Sécurité

- ✅ Azure AD SSO obligatoire
- ✅ Chiffrement at-rest & in-transit
- ✅ RGPD compliant
- ✅ Rate limiting (Upstash)
- ✅ Audit trail complet
- ✅ Azure Key Vault (prod)

**Signaler une vulnérabilité**: security@memolib.com

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Ouvrir une Pull Request

---

## 📝 License

Propriétaire - © 2026 MemoLib. Tous droits réservés.

---

## 🆘 Support

- 📧 Email: support@memolib.com
- 💬 Discord: [discord.gg/memolib](https://discord.gg/memolib)
- 📖 Docs: [docs.memolib.com](https://docs.memolib.com)

---

**Fait avec ❤️ par l'équipe MemoLib**
