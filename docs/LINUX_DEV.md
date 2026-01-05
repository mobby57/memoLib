# Guide de Développement Linux

## Configuration Initiale

### Prérequis
```bash
# Node.js 20+ et npm
node --version  # v20.x.x
npm --version   # 10.x.x

# Git configuré
git --version
```

### Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd iaPostemanage

# Exécuter le script de setup Linux
chmod +x scripts/linux-setup.sh
./scripts/linux-setup.sh
```

## Scripts npm

```bash
# Développement avec Turbopack
npm run dev

# Build de production
npm run build

# Tests
npm run test
npm run test:watch

# Vérification TypeScript
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatage
npm run format
npm run format:check

# Validation complète
npm run validate
```

## Base de Données (Prisma)

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name description_migration

# Appliquer les migrations en production
npx prisma migrate deploy

# Seed la base de données
npx prisma db seed

# Studio Prisma (interface graphique)
npx prisma studio
```

## Variables d'Environnement

Créer un fichier `.env.local`:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere-avec-openssl-rand-base64-32"

# Optionnel: OpenAI pour l'IA
OPENAI_API_KEY="sk-..."
```

## Différences Windows/Linux

### Sensibilité à la Casse
⚠️ Linux est sensible à la casse pour les imports:

```typescript
// ✅ Correct
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// ❌ Erreur sur Linux si le fichier est Card.tsx
import { Card } from '@/components/ui/card';
```

### Fins de Ligne
Le projet utilise LF (configuré via `.gitattributes`):

```bash
# Vérifier les fins de ligne
file src/app/page.tsx

# Convertir CRLF → LF si nécessaire
dos2unix src/**/*.{ts,tsx,js,jsx}
```

### Scripts Shell
Les scripts `.sh` doivent avoir les permissions d'exécution:

```bash
chmod +x scripts/*.sh
```

## Développement

### Structure des Dossiers
```
src/
├── app/              # Routes Next.js 14 (App Router)
├── components/       # Composants réutilisables
├── lib/             # Services, utils, types
├── hooks/           # React hooks personnalisés
├── middleware/      # Middleware Next.js
└── types/           # Définitions TypeScript

prisma/
├── schema.prisma    # Schéma de base de données
└── migrations/      # Migrations SQL
```

### Hot Reload
Next.js Turbopack supporte le hot reload sur Linux:

```bash
npm run dev
# Serveur sur http://localhost:3000
# Le navigateur se recharge automatiquement
```

## Troubleshooting

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur Prisma
```bash
# Regénérer le client
npx prisma generate

# Réinitialiser la base de données (⚠️ supprime les données)
npx prisma migrate reset
```

### Erreur de permissions
```bash
# Donner les permissions d'exécution
chmod +x scripts/linux-setup.sh
chmod +x node_modules/.bin/*
```

### Port 3000 déjà utilisé
```bash
# Utiliser un autre port
PORT=3001 npm run dev

# Ou tuer le processus sur le port 3000
lsof -ti:3000 | xargs kill -9
```

## Déploiement

### Build de Production
```bash
# Build optimisé
npm run build

# Tester le build
npm start
```

### Variables d'Environnement Production
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
NEXTAUTH_URL="https://votre-domaine.com"
NEXTAUTH_SECRET="secret-production-tres-long-et-securise"
```

### Docker (optionnel)
```bash
# Build de l'image
docker build -t iapostemanage .

# Run le container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  iapostemanage
```

## Tests

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Coverage
npm run test -- --coverage

# Tests spécifiques
npm test -- src/components/Navigation.test.tsx
```

## Performance

### Analyse du Bundle
```bash
# Analyser la taille du bundle
npm run build:analyze

# Ouvre automatiquement un rapport dans le navigateur
```

### Monitoring
Le projet inclut:
- Performance monitoring (Web Vitals)
- Error tracking
- Audit logging

## Support

Pour toute question:
1. Vérifier la documentation dans `/docs`
2. Consulter les issues GitHub
3. Lire les commentaires dans le code
