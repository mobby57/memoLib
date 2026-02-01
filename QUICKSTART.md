# 🚀 Guide de démarrage rapide - MemoLib

## ✅ Prérequis

- Node.js 18+ (recommandé: 20+)
- npm 9+
- Git

## 📦 Installation

```bash
# 1. Cloner le projet
git clone https://github.com/your-org/memolib.git
cd memolib

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos credentials

# 4. Initialiser la base de données
npm run db:push
npm run db:seed

# 5. Valider l'installation
npm run validate:project
```

## 🏃 Lancer le projet

```bash
# Mode développement (avec Turbopack)
npm run dev

# Ouvrir http://localhost:3000
```

## 🔧 Commandes essentielles

### Développement
```bash
npm run dev              # Dev avec Turbopack
npm run dev:debug        # Dev avec debugger
npm run build            # Build production
npm run start            # Démarrer en production
```

### TypeScript
```bash
npm run type-check:diagnostic  # Diagnostic complet
npm run type-check:changed     # Vérifier fichiers modifiés
npm run type-check:watch       # Mode watch
```

### Base de données
```bash
npm run db:push          # Push schema
npm run db:studio        # Interface Prisma Studio
npm run db:migrate       # Créer migration
npm run db:seed          # Seed données
```

### Tests
```bash
npm run test             # Tests unitaires
npm run test:e2e         # Tests E2E
npm run test:coverage    # Coverage report
```

### Qualité
```bash
npm run validate:project # Validation rapide
npm run validate         # Type-check + lint + test
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code (Prettier)
```

## 📁 Structure du projet

```
memolib/
├── src/
│   ├── app/              # Next.js App Router (pages)
│   ├── components/       # Composants React réutilisables
│   ├── lib/              # Services & utilitaires
│   ├── hooks/            # React hooks personnalisés
│   └── types/            # Types TypeScript
├── prisma/               # Schéma & migrations DB
├── scripts/              # Scripts utilitaires
├── docs/                 # Documentation
└── tests/                # Tests E2E
```

## 🐛 Résolution de problèmes

### TypeScript "Terminated" (Code 143)

Si `tsc --noEmit` se termine brutalement :

```bash
# Solution 1 : Vérifier seulement les fichiers modifiés
npm run type-check:changed

# Solution 2 : Utiliser Next.js build
npm run build

# Solution 3 : Diagnostic
npm run type-check:diagnostic
```

Voir [docs/TYPESCRIPT_TROUBLESHOOTING.md](docs/TYPESCRIPT_TROUBLESHOOTING.md) pour plus de détails.

### Erreurs de build

```bash
# Nettoyer le cache
npm run clean

# Réinstaller
npm run fresh
```

### Erreurs Prisma

```bash
# Régénérer le client
npm run db:generate

# Reset complet
npm run db:reset
```

## 📚 Documentation

- [README.md](README.md) - Vue d'ensemble
- [TODO.md](TODO.md) - Roadmap du projet
- [CHANGELOG.md](CHANGELOG.md) - Historique des modifications
- [docs/TYPESCRIPT_TROUBLESHOOTING.md](docs/TYPESCRIPT_TROUBLESHOOTING.md) - Guide TypeScript
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture du projet

## 🔐 Configuration minimale

Variables d'environnement requises dans `.env.local` :

```bash
# NextAuth
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Base de données (dev)
DATABASE_URL=file:./dev.db

# Azure AD (optionnel en dev)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

Voir [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) pour la liste complète.

## 🎯 Workflow de développement

1. **Créer une branche**
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```

2. **Développer**
   ```bash
   npm run dev
   # Coder...
   ```

3. **Vérifier avant commit**
   ```bash
   npm run type-check:changed
   npm run lint:fix
   npm run test
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: ma nouvelle fonctionnalité"
   ```

5. **Push & Pull Request**
   ```bash
   git push origin feature/ma-fonctionnalite
   # Créer une PR sur GitHub
   ```

## 🚀 Déploiement

### Vercel (recommandé)
```bash
npm run deploy:vercel
```

### Azure Static Web Apps
```bash
npm run deploy:azure
```

### Cloudflare Pages
```bash
npm run cf:deploy
```

## 💡 Astuces

### VS Code

Extensions recommandées :
- ESLint
- Prettier
- Prisma
- TypeScript and JavaScript Language Features

### Performance

```bash
# Analyser le bundle
npm run analyze

# Nettoyer le cache régulièrement
npm run clean
```

### Base de données

```bash
# Interface graphique
npm run db:studio

# Backup
npm run db:backup
```

## 🆘 Support

- 📧 Email: support@memolib.com
- 💬 Discord: [discord.gg/memolib](https://discord.gg/memolib)
- 📖 Docs: [docs.memolib.com](https://docs.memolib.com)

## 📝 Checklist premier lancement

- [ ] Node.js 18+ installé
- [ ] `npm install` exécuté
- [ ] `.env.local` configuré
- [ ] `npm run db:push` exécuté
- [ ] `npm run validate:project` passe ✅
- [ ] `npm run dev` fonctionne
- [ ] http://localhost:3000 accessible

---

**Prêt à coder !** 🎉
