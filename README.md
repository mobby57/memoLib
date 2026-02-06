# MemoLib

> Plateforme intelligente de gestion juridique et administrative pour avocats et professionnels du droit

[![Next.js](https://img.shields.io/badge/Next.js-16.1.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-Private-red)](LICENSE)

## 📋 Documentation Rapide

- 🎯 **Nouveau?** → Lisez [START_HERE.md](START_HERE.md)
- ⚡ **Améliorations?** → Lisez [QUICK_IMPROVEMENTS.md](QUICK_IMPROVEMENTS.md)
- 📚 **Index complet?** → Lisez [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

## 🎯 Description

MemoLib est une solution SaaS complète pour la gestion de cabinets juridiques, offrant :

- 📧 **Gestion intelligente des emails** avec filtrage automatique et scoring
- 📁 **Gestion de dossiers** clients avec suivi des deadlines
- 🤖 **Assistant IA** pour l'analyse juridique (CESEDA, Légifrance)
- 📊 **Tableaux de bord** analytics et métriques
- 🔒 **Conformité RGPD** avec audit trail immutable
- 💳 **Facturation intégrée** via Stripe
- 🔐 **Authentification sécurisée** avec 2FA

## 🚀 Quick Start

### Prérequis

- Node.js 18+ 
- PostgreSQL 14+ (ou SQLite pour dev)
- npm ou yarn

### Installation

```bash
# Cloner le projet
git clone <repository-url>
cd memolib

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos credentials

# Initialiser la base de données
npx prisma generate
npx prisma db push
npm run db:seed

# Démarrer en développement
npm run dev
```

Accédez à [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Principaux

```bash
# Développement
npm run dev              # Démarrer avec Turbopack
npm run dev:debug        # Mode debug avec inspector

# Build & Production
npm run build            # Build optimisé
npm run start            # Démarrer en production
npm run preview          # Build + start

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests end-to-end (Playwright)
npm run test:coverage    # Rapport de couverture

# Base de données
npm run db:studio        # Interface Prisma Studio
npm run db:migrate       # Créer une migration
npm run db:seed          # Peupler avec données de démo

# Qualité du code
npm run lint             # Linter ESLint
npm run type-check       # Vérification TypeScript
npm run format           # Formatter avec Prettier
npm run validate         # Lint + Type + Test

# Déploiement
npm run deploy:vercel    # Déployer sur Vercel
npm run build:azure      # Build pour Azure Static Web Apps
```

## 🏗️ Architecture

```
memolib/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React réutilisables
│   ├── lib/              # Logique métier et services
│   ├── hooks/            # Custom React hooks
│   ├── types/            # Définitions TypeScript
│   └── middleware/       # Middlewares Next.js
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── migrations/       # Migrations SQL
├── public/               # Assets statiques
├── docs/                 # Documentation technique
└── scripts/              # Scripts utilitaires
```

## 🔧 Technologies

**Frontend:**
- Next.js 16 (App Router, Server Components)
- React 19
- TypeScript 5.9
- Tailwind CSS 3.4
- Shadcn/ui components

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL / SQLite
- NextAuth.js (authentification)

**Services:**
- Stripe (paiements)
- SendGrid (emails)
- Upstash Redis (cache)
- Vercel Blob (stockage)
- Sentry (monitoring)

**DevOps:**
- GitHub Actions (CI/CD)
- Playwright (E2E tests)
- Jest (unit tests)
- ESLint + Prettier

## 📚 Documentation

### Guides Principaux
- [START_HERE.md](START_HERE.md) - 🎯 Point d'entrée ultra-simple
- [QUICK_IMPROVEMENTS.md](QUICK_IMPROVEMENTS.md) - ⚡ Application des améliorations
- [FINAL_RECAP.md](FINAL_RECAP.md) - ✨ Récapitulatif complet
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - 📖 Index de navigation

### Guides Techniques
- [CONTRIBUTING.md](CONTRIBUTING.md) - 🤝 Comment contribuer
- [SECURITY.md](SECURITY.md) - 🔒 Politique de sécurité
- [CLEANUP_GUIDE.md](CLEANUP_GUIDE.md) - 🧹 Guide de nettoyage
- [DEPENDENCIES_AUDIT.md](DEPENDENCIES_AUDIT.md) - 📦 Audit des dépendances

### Documentation Détaillée
- [Guide de démarrage rapide](QUICK_START.md)
- [Architecture technique](docs/ARCHITECTURE.md)
- [Guide de déploiement](docs/DEPLOYMENT_GUIDE.md)
- [API Documentation](docs/API_ROUTES.md)
- [Conformité RGPD](docs/CONFORMITE_RGPD_CHECKLIST.md)

## 🔐 Sécurité

- Authentification multi-facteurs (2FA)
- Chiffrement des données sensibles
- Audit trail immutable (EventLog)
- Rate limiting avec Upstash
- Scan de sécurité automatique (GitGuardian)
- Headers de sécurité (CSP, HSTS)

## 🧪 Tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e

# Couverture complète
npm run test:all
```

Couverture actuelle: ~30% (objectif: 80%)

## 🧹 Nettoyage & Maintenance

```bash
# Nettoyage automatique
.\clean-project.ps1              # Windows
./clean-project.sh               # Linux/Mac

# Nettoyage complet
.\clean-project.ps1 --deep

# Appliquer toutes les améliorations
.\apply-improvements.ps1

# Audit des dépendances
npm run deps:check               # Vérifier obsolètes
npm run deps:unused              # Trouver inutilisées
npm run deps:clean               # Nettoyer
```

Voir [CLEANUP_GUIDE.md](CLEANUP_GUIDE.md) pour plus de détails.

## 🚢 Déploiement

### Vercel (Recommandé)

```bash
npm run deploy:vercel
```

### Azure Static Web Apps

```bash
npm run build:azure
npm run deploy:azure
```

### Docker

```bash
docker-compose up -d
```

## 🤝 Contribution

Ce projet est actuellement privé. Pour contribuer :

1. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
2. Commit les changements (`git commit -m 'Add AmazingFeature'`)
3. Push vers la branche (`git push origin feature/AmazingFeature`)
4. Ouvrir une Pull Request

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 License

Propriétaire - Tous droits réservés

## 👥 Équipe

Développé avec ❤️ pour les professionnels du droit

## 📞 Support

Pour toute question ou problème :
- 📧 Email: support@memolib.com
- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: GitHub Issues

---

**Version:** 0.1.0  
**Dernière mise à jour:** Février 2026
