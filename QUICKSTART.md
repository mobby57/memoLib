# 🚀 Guide de Démarrage Rapide - iaPostemanage

## Prérequis
- Node.js 18+
- PostgreSQL (ou compte Neon)
- Git

## Installation (5 minutes)

### 1. Cloner et installer
```bash
cd iaPostemanage
npm install
```

### 2. Configuration base de données
```bash
# Copier le fichier d'environnement
cp .env.example .env.local

# Éditer .env.local avec vos credentials
DATABASE_URL="postgresql://user:password@localhost:5432/iapostemanage"
NEXTAUTH_SECRET="votre-secret-genere"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Initialiser la base de données
```bash
# Créer les tables
npx prisma db push

# Générer le client Prisma
npx prisma generate

# Seed avec données de test
npm run db:seed
```

### 4. Démarrer l'application
```bash
npm run dev
```

Ouvrir http://localhost:3000

## Comptes de Test

Après le seed, vous aurez :

**Super Admin**
- Email: `admin@iapostemanage.com`
- Password: `Admin123!`

**Avocat (Cabinet Test)**
- Email: `avocat@cabinet-test.fr`
- Password: `Avocat123!`

**Client**
- Email: `client@example.com`
- Password: `Client123!`

## Structure du Projet

```
iaPostemanage/
├── src/
│   ├── app/              # Pages Next.js
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # Dashboard admin
│   │   ├── auth/         # Authentification
│   │   └── page.tsx      # Landing page
│   ├── components/       # Composants React
│   ├── lib/              # Utilitaires
│   └── hooks/            # React hooks
├── prisma/
│   ├── schema.prisma     # Modèle de données
│   └── seed.ts           # Données de test
└── public/               # Assets statiques
```

## Commandes Utiles

```bash
# Développement
npm run dev              # Démarrer en mode dev
npm run build            # Build production
npm run start            # Démarrer en production

# Base de données
npm run db:studio        # Interface Prisma Studio
npm run db:push          # Appliquer le schéma
npm run db:seed          # Insérer données test
npm run db:backup        # Backup DB

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests end-to-end

# Nettoyage
./clean-project.ps1      # Nettoyer fichiers temporaires
```

## Prochaines Étapes

1. **Tester le dashboard** : Connectez-vous avec le compte avocat
2. **Créer un client** : Aller sur /clients
3. **Créer un dossier** : Aller sur /dossiers
4. **Uploader un document** : Dans un dossier

## Problèmes Courants

### Erreur Prisma
```bash
# Régénérer le client
npx prisma generate
```

### Port 3000 occupé
```bash
# Changer le port
PORT=3001 npm run dev
```

### Erreur de connexion DB
- Vérifier DATABASE_URL dans .env.local
- Vérifier que PostgreSQL est démarré

## Support

- Documentation : `/docs`
- Plan d'adaptation : `PLAN_ADAPTATION.md`
- Issues : Créer une issue GitHub

## Déploiement

### Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

Configuration automatique :
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

Variables d'environnement à configurer :
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

---

**Prêt à démarrer !** 🎉
