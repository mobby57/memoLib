# 🚀 MemoLib - Plateforme Juridique Intelligente

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![.NET](https://img.shields.io/badge/.NET-9.0-512BD4)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black)](https://vercel.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Qu'est-ce que MemoLib ?

**MemoLib** est une plateforme de gestion des dossiers et communications pour **cabinets d'avocats**. Elle automatise le workflow complet : réception d'emails, extraction d'informations clients, gestion de dossiers, facturation, et conformité RGPD.

### Pour qui ?

- ⚖️ Cabinets d'avocats (1-50 avocats)
- 📜 Notaires, huissiers, experts juridiques
- 🏢 PME juridiques

---

## 🛠️ Stack Technique

### Frontend (Next.js)

| Composant         | Technologie                                                |
| ----------------- | ---------------------------------------------------------- |
| Framework         | Next.js 16 + React 19                                      |
| Langage           | TypeScript 5.9                                             |
| ORM               | Prisma 5                                                   |
| Base de données   | PostgreSQL                                                 |
| Auth              | NextAuth (Credentials, Google, GitHub, Azure AD optionnel) |
| UI                | Tailwind CSS 3 + Lucide React                              |
| Déploiement       | **Vercel**                                                 |
| Stockage fichiers | Vercel Blob (cloud) / local (fallback)                     |
| Rate limiting     | Upstash Redis                                              |
| Monitoring        | Sentry                                                     |
| Paiements         | Stripe                                                     |

### Backend API (.NET)

| Composant       | Technologie                        |
| --------------- | ---------------------------------- |
| Framework       | ASP.NET Core 9.0                   |
| ORM             | Entity Framework Core 9.0          |
| Base de données | SQLite (local) / PostgreSQL (prod) |
| Email           | MailKit (IMAP/SMTP)                |
| Auth            | JWT Bearer + BCrypt                |
| Validation      | FluentValidation                   |
| Déploiement     | Docker / local                     |

### Sécurité

- Hashing BCrypt pour mots de passe
- JWT + NextAuth sessions
- RBAC multi-rôles (SUPER_ADMIN, ADMIN, AVOCAT, ASSOCIE, COLLABORATEUR, SECRETAIRE, COMPTABLE, STAGIAIRE, CLIENT)
- Multi-tenant par cabinet
- Audit trail complet
- Antivirus scan sur uploads
- Rate limiting par utilisateur/IP

---

## ⚠️ Azure n'est PAS requis

Azure intervient **uniquement** comme provider OAuth optionnel (Azure AD SSO). Le projet tourne sur **Vercel** (frontend) et **Docker/local** (backend .NET). Aucun service Azure n'est nécessaire pour faire tourner MemoLib.

---

## 📦 Installation

### Prérequis

- Node.js 20+ et npm
- .NET 9.0 SDK (pour le backend API)
- PostgreSQL (ou SQLite en local)
- Git

### Frontend (Next.js)

```powershell
# 1. Cloner
git clone https://github.com/VOTRE_USERNAME/MemoLib.git
cd MemoLib

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# 4. Générer Prisma et migrer la DB
npx prisma generate
npx prisma migrate deploy

# 5. Lancer en dev
npm run dev
```

**Accès :** http://localhost:3000

### Backend .NET (optionnel, pour l'API legacy)

```powershell
cd MemoLib
dotnet restore
dotnet ef database update
dotnet run
```

**Accès API :** http://localhost:5078

---

## ⚙️ Configuration

### Variables d'environnement principales

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/memolib"

# Auth
NEXTAUTH_SECRET="votre-secret"
NEXTAUTH_URL="http://localhost:3000"

# OAuth (tous optionnels)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
AZURE_CLIENT_ID=""
AZURE_CLIENT_SECRET=""
AZURE_TENANT_ID=""

# Stockage fichiers (optionnel, fallback local sinon)
BLOB_READ_WRITE_TOKEN=""

# Stripe (optionnel)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email SMTP (optionnel)
EMAIL_SERVER=""
EMAIL_FROM=""

# Rate limiting (optionnel)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Monitoring (optionnel)
SENTRY_DSN=""
```

### Gmail IMAP (backend .NET)

```json
{
  "EmailMonitor": {
    "Enabled": true,
    "ImapHost": "imap.gmail.com",
    "ImapPort": 993,
    "Username": "votre-email@gmail.com",
    "IntervalSeconds": 60
  }
}
```

```powershell
dotnet user-secrets set "EmailMonitor:Password" "votre-mot-de-passe-application"
```

---

## ✨ Fonctionnalités

### 📧 Emails

- Monitoring automatique Gmail (IMAP) via backend .NET
- Ingestion d'emails via API Next.js
- Détection de doublons (hash + messageId)
- Extraction automatique des infos clients
- Templates d'emails avec variables dynamiques

### 📁 Dossiers

- Workflow de statut complet
- Attribution à des avocats
- Tags, priorités, échéances
- Timeline complète par dossier
- Délais légaux avec alertes automatiques (J-7, J-3, J-1)

### 👥 Clients

- Fiche client 360° avec historique
- Extraction auto des coordonnées
- Portail client dédié
- Onboarding automatisé

### 📄 Documents

- Upload sécurisé (validation MIME, antivirus, extensions dangereuses bloquées)
- Stockage Vercel Blob ou local
- OCR sur PDF
- Preuves juridiques horodatées

### 💰 Facturation

- Création de factures avec lignes détaillées
- Suivi des paiements (Stripe)
- Facturation à l'usage (OCR, signatures, SMS)
- Export PDF/Excel

### 🔍 Recherche

- Recherche textuelle
- Recherche par embeddings (similarité vectorielle)
- Recherche sémantique IA

### 📊 Analytics

- Dashboard avec statistiques
- Rapports personnalisés
- Centre d'anomalies
- Audit trail complet

### 🔔 Notifications

- Temps réel (SignalR côté .NET)
- Push notifications
- Alertes échéances

### 🔐 Conformité

- RGPD : anonymisation, droit à l'oubli, registre des traitements
- Archivage avec politiques de rétention
- Preuves juridiques chaînées (hash chain)

---

## 📁 Structure du Projet

```
MemoLib/
├── src/                      # Frontend Next.js
│   ├── app/                  # App Router (pages + API routes)
│   │   └── api/              # API endpoints Next.js
│   ├── components/           # Composants React
│   ├── lib/                  # Utilitaires, Prisma, auth, billing
│   ├── hooks/                # React hooks
│   ├── types/                # Types TypeScript
│   └── styles/               # CSS / Tailwind
├── prisma/                   # Schéma Prisma + migrations PostgreSQL
├── Controllers/              # API .NET (backend legacy)
├── Services/                 # Logique métier .NET
├── Models/                   # Entités .NET
├── Data/                     # DbContext EF Core
├── Migrations/               # Migrations EF Core (PostgreSQL)
├── Migrations_sqlite_backup/ # Migrations SQLite (historique)
├── wwwroot/                  # Interface web statique (.NET)
├── scripts/                  # Scripts utilitaires
├── tests/                    # Tests .NET
├── __tests__/                # Tests Jest/Playwright
├── public/                   # Assets statiques Next.js
├── docker-compose.yml        # Docker pour backend .NET
├── vercel.json               # Config déploiement Vercel
├── package.json              # Dépendances Node.js
└── MemoLib.Api.csproj        # Projet .NET
```

---

## 🧪 Tests

```powershell
# Tests unitaires (Jest)
npm test

# Tests avec couverture
npm run test:coverage

# Tests E2E (Playwright)
npm run test:e2e

# Tests CI
npm run test:ci

# Flux onboarding E2E
npm run api:e2e:onboarding

# Tests .NET
cd tests && dotnet test
```

---

## 🚀 Déploiement

### Frontend → Vercel (recommandé)

```powershell
# Preview
npm run deploy:vercel:preview

# Production
npm run deploy:vercel
```

### Backend .NET → Docker

```powershell
docker-compose up -d
```

### Local complet

```powershell
# Frontend
npm run dev

# Backend .NET (dans un autre terminal)
dotnet run
```

---

## 📊 API Endpoints (Next.js)

### Auth

```
POST /api/auth/[...nextauth]  # NextAuth (login, register, OAuth)
```

### Documents

```
POST /api/documents/upload     # Upload document
GET  /api/documents/upload     # Liste documents d'un dossier
```

### Emails

```
POST /api/emails/incoming      # Ingestion email
GET  /api/lawyer/workspace-emails  # Emails du workspace
```

### Cron

```
GET /api/cron/deadline-alerts  # Alertes échéances (quotidien)
GET /api/cron/cost-alerts      # Alertes coûts (quotidien)
```

### API .NET (backend legacy, port 5078)

```
POST /api/auth/register
POST /api/auth/login
GET  /api/cases
POST /api/cases
GET  /api/cases/{id}/timeline
POST /api/ingest/email
POST /api/email-scan/manual
POST /api/email/send
GET  /api/client
POST /api/search/events
POST /api/attachment/upload/{eventId}
```

---

## 🐛 Dépannage

### La DB ne se connecte pas

```powershell
# Vérifier PostgreSQL
pg_isready -h localhost -p 5432

# Régénérer Prisma
npx prisma generate
npx prisma migrate deploy
```

### Erreur Next.js mémoire

```powershell
# Augmenter la mémoire Node
cross-env NODE_OPTIONS=--max-old-space-size=8192 npm run dev
```

### Port 5078 occupé (.NET)

```powershell
netstat -ano | findstr :5078
taskkill /PID <PID> /F
```

---

## 📈 Roadmap

### ✅ Version actuelle

- [x] Multi-tenant RBAC complet
- [x] Gestion dossiers + clients + emails
- [x] Facturation Stripe + usage billing
- [x] Documents avec antivirus + OCR
- [x] Délais légaux avec alertes
- [x] Preuves juridiques chaînées
- [x] Conformité RGPD
- [x] Déploiement Vercel + Docker
- [x] CI/CD GitHub Actions

### 🚧 Prochaine version

- [ ] IA classification emails (Ollama)
- [ ] Export PDF/Excel avancé
- [ ] Rapports personnalisés
- [ ] Tests E2E complets

### 💡 Future

- [ ] Application mobile (React Native)
- [ ] Redis cache distribué
- [ ] Elasticsearch recherche avancée

---

## 📝 Licence

MIT License - Libre d'utilisation commerciale et personnelle.

## 📞 Support

- 📚 Documentation : fichiers `docs/` dans le projet
- 🐛 Issues : [GitHub Issues](https://github.com/VOTRE_USERNAME/MemoLib/issues)
