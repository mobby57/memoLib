# MemoLib - Documentation Complète

## 🚀 Quick Start

```bash
# Installation
npm install

# Développement
npm run dev

# Production
npm run build
npm start
```

## 📁 Structure du Projet

```
memoLib/
├── src/
│   ├── app/          # Pages Next.js (App Router)
│   ├── components/   # Composants React réutilisables
│   ├── lib/          # Logique métier et utilitaires
│   └── styles/       # Styles globaux
├── prisma/           # Schéma base de données
├── docs/             # Documentation détaillée
└── tests/            # Tests unitaires et e2e
```

## 🛠️ Scripts Disponibles

### Développement
- `npm run dev` - Serveur de développement avec Turbopack
- `npm run dev:debug` - Mode debug avec inspect

### Build & Deploy
- `npm run build` - Build de production
- `npm run start` - Lancer en production

### Qualité de Code
- `npm run lint` - Linter ESLint
- `npm run type-check` - Vérification TypeScript
- `npm run test` - Tests Jest
- `npm run dx:check` - Vérification complète

### Developer Experience
- `npm run dx:setup` - Setup complet du projet
- `npm run dx:reset` - Reset et réinstallation
- `npm run dx:health` - Vérifier l'environnement

## 🔧 Configuration

### Variables d'environnement
Copier `.env.example` vers `.env.local` et configurer:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

## 📚 Documentation Détaillée

Voir le dossier `docs/` pour:
- Architecture technique
- Guide de contribution
- Workflows CI/CD
- Sécurité et RGPD

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add: Amazing Feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Propriétaire - © 2026 MemoLib
