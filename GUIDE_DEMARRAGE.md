# 🚀 Guide de Démarrage - IA Poste Manager

## 📋 Table des Matières
1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Seed de la Base de Données](#seed-de-la-base-de-données)
4. [Démarrage du Serveur](#démarrage-du-serveur)
5. [Connexion à l'Application](#connexion-à-lapplication)
6. [Comptes de Test](#comptes-de-test)
7. [Architecture](#architecture)
8. [Espaces Utilisateurs](#espaces-utilisateurs)

---

## 🔧 Installation

### Prérequis
- **Node.js** >= 18.0.0
- **npm** ou **yarn**
- **Git**

### Étapes

```bash
# 1. Cloner le dépôt
git clone <repository-url>
cd iaPostemanage

# 2. Installer les dépendances
npm install

# 3. Générer le client Prisma
npx prisma generate

# 4. Appliquer les migrations
npx prisma migrate dev
```

---

## ⚙️ Configuration

### Fichier `.env`

Créez un fichier `.env` à la racine du projet:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-super-securise-changez-moi"

# Ollama (IA locale)
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2:latest"

# Email (optionnel)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"
```

**Important**: Changez le `NEXTAUTH_SECRET` en production avec une valeur générée aléatoirement.

---

## 🌱 Seed de la Base de Données

### Script de Seed Complet

Le script `seed-complete.ts` crée automatiquement:
- ✅ **1 Plan** (Premium)
- ✅ **1 Tenant** (Cabinet Demo)
- ✅ **1 Admin** (admin@demo.com)
- ✅ **3 Clients** avec leurs comptes utilisateurs
- ✅ **9 Dossiers** (2-4 par client)
- ✅ **Documents** (1-3 par dossier)
- ✅ **Échéances** (1-2 par dossier)

### Exécution

```bash
npm run db:seed:complete
```

### Résultat Attendu

```
🎉 Seed completed successfully!

📋 Summary:
-----------------------------------
✅ Plan: Premium
✅ Tenant: Cabinet Demo
✅ Admin: admin@demo.com (password: demo123)
✅ Clients: 3
   1. client1@demo.com (password: demo123)
   2. client2@demo.com (password: demo123)
   3. client3@demo.com (password: demo123)
✅ Dossiers: 9
✅ Documents, Échéances ✓
-----------------------------------
```

---

## 🚀 Démarrage du Serveur

### Mode Développement

```bash
npm run dev
```

Le serveur démarre sur: **http://localhost:3000**

### Mode Production

```bash
# Build
npm run build

# Start
npm start
```

---

## 🔐 Connexion à l'Application

### URL de Connexion

Ouvrez votre navigateur et allez à:

```
http://localhost:3000/auth/login
```

---

## 👤 Comptes de Test

### Admin / Avocat

- **Email**: `admin@demo.com`
- **Mot de passe**: `demo123`
- **Accès**: Espace Admin complet

**Fonctionnalités**:
- 📊 Dashboard avec statistiques
- 👥 Gestion des clients
- 📁 Gestion des dossiers
- 📄 Tous les documents
- 💬 Messages avec tous les clients
- ⚙️ Paramètres et profil

### Clients

#### Client 1
- **Email**: `client1@demo.com`
- **Mot de passe**: `demo123`
- **Nationalité**: Algérienne
- **Dossiers**: 2 dossiers

#### Client 2
- **Email**: `client2@demo.com`
- **Mot de passe**: `demo123`
- **Nationalité**: Tunisienne
- **Dossiers**: 3 dossiers

#### Client 3
- **Email**: `client3@demo.com`
- **Mot de passe**: `demo123`
- **Nationalité**: Marocaine
- **Dossiers**: 4 dossiers

**Fonctionnalités Client**:
- 📊 Dashboard personnel
- 📁 Mes dossiers (consultation détaillée)
- 📄 Mes documents
- 💬 Messages avec l'avocat
- ⚙️ Mon profil
- 💳 Mes factures

---

## 🏗️ Architecture

### Stack Technique

- **Frontend**: Next.js 16.1.1 (App Router)
- **Backend**: Next.js API Routes
- **Database**: SQLite avec Prisma ORM
- **Auth**: NextAuth.js (session-based)
- **Styling**: Tailwind CSS
- **TypeScript**: Strict mode
- **Security**: bcrypt, CSRF protection, tenant isolation

### Structure des Dossiers

```
iaPostemanage/
├── src/
│   ├── app/
│   │   ├── admin/           # Espace Admin/Avocat
│   │   │   ├── page.tsx     # Dashboard admin
│   │   │   ├── clients/     # Gestion clients
│   │   │   ├── dossiers/    # Gestion dossiers
│   │   │   ├── documents/   # Documents
│   │   │   ├── messages/    # Messagerie
│   │   │   └── parametres/  # Paramètres
│   │   ├── client/          # Espace Client
│   │   │   ├── page.tsx     # Dashboard client
│   │   │   ├── dossiers/    # Mes dossiers
│   │   │   ├── documents/   # Mes documents
│   │   │   ├── messages/    # Messages
│   │   │   └── profil/      # Mon profil
│   │   ├── api/             # API Routes
│   │   │   ├── admin/       # API Admin
│   │   │   ├── client/      # API Client
│   │   │   └── auth/        # Authentication
│   │   └── auth/
│   │       └── login/       # Page de connexion
│   ├── components/          # Composants réutilisables
│   │   ├── AdminNavigation.tsx
│   │   ├── ClientNavigation.tsx
│   │   └── forms/
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilitaires
│   └── types/               # Types TypeScript
├── prisma/
│   ├── schema.prisma        # Schéma de base de données
│   ├── seed.ts              # Seed simple
│   └── seed-complete.ts     # Seed complet (UTILISÉ)
└── docs/                    # Documentation
    ├── ESPACE_CLIENT_COMPLET.md
    └── ESPACE_ADMIN_COMPLET.md
```

---

## 🌐 Espaces Utilisateurs

### 🔵 Espace Client

**Navigation**: 6 pages
1. **Dashboard** - Vue d'ensemble (dossiers, documents, messages, échéances)
2. **Mes Dossiers** - Liste et détails de tous les dossiers
3. **Mes Documents** - Tous les documents (upload possible)
4. **Messages** - Chat avec l'avocat
5. **Mon Profil** - Informations personnelles + changement de mot de passe
6. **Mes Factures** - Historique de facturation

**Fonctionnalités**:
- ✅ Consultation en temps réel des dossiers
- ✅ Upload de documents (PDF, Images, Word)
- ✅ Messagerie instantanée avec l'avocat
- ✅ Timeline d'activité des dossiers
- ✅ Gestion du profil

### 🔴 Espace Admin/Avocat

**Navigation**: 6 pages
1. **Dashboard** - Statistiques globales (clients, dossiers, documents, échéances)
2. **Clients** - Liste complète avec recherche/filtres
3. **Dossiers** - Gestion de tous les dossiers
4. **Documents** - Accès à tous les documents (téléchargement)
5. **Messages** - Conversations avec tous les clients
6. **Paramètres** - Profil admin + sécurité

**Fonctionnalités**:
- ✅ Gestion complète des clients (CRUD)
- ✅ Gestion des dossiers (CRUD)
- ✅ Accès centralisé aux documents
- ✅ Messagerie multi-clients avec indicateurs non-lus
- ✅ Recherche et filtres avancés

---

## 🔐 Sécurité

### Mesures Implémentées

1. **Authentication**:
   - NextAuth.js avec sessions
   - Mots de passe hashés (bcrypt, salt=12)
   - Protection CSRF

2. **Authorization**:
   - Vérification de rôle (ADMIN, CLIENT)
   - Isolation par tenant (multi-tenant)
   - Validation des accès aux ressources

3. **Data Protection**:
   - Validation des uploads (MIME type, taille)
   - Protection contre l'injection SQL (Prisma)
   - Validation des entrées utilisateur

4. **Privacy**:
   - Les clients ne voient que leurs données
   - Les admins ne voient que les données de leur tenant
   - Logs d'audit (à venir)

---

## 📝 Commandes Utiles

```bash
# Développement
npm run dev                    # Démarrer le serveur de développement
npm run build                  # Build production
npm start                      # Démarrer en production

# Base de données
npm run db:seed:complete       # Seed complet (recommandé)
npm run db:studio              # Interface graphique Prisma Studio
npx prisma migrate dev         # Créer une migration
npx prisma generate            # Régénérer le client Prisma

# Tests
npm run test                   # Lancer les tests
npm run test:watch             # Tests en mode watch
npm run lint                   # Vérifier le code
npm run type-check             # Vérifier les types TypeScript
```

---

## 🐛 Dépannage

### Problème: "Database not found"
```bash
npx prisma migrate dev
npx prisma generate
```

### Problème: "Module not found"
```bash
rm -rf node_modules
npm install
```

### Problème: "Port 3000 already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou changez le port
PORT=3001 npm run dev
```

### Problème: "Prisma Client outdated"
```bash
npx prisma generate
```

---

## 📚 Documentation Complète

Pour plus de détails:
- **[ESPACE_CLIENT_COMPLET.md](./docs/ESPACE_CLIENT_COMPLET.md)** - Documentation de l'espace client
- **[ESPACE_ADMIN_COMPLET.md](./docs/ESPACE_ADMIN_COMPLET.md)** - Documentation de l'espace admin
- **[README.md](./README.md)** - README principal du projet

---

## 🎯 Prochaines Étapes

Après avoir démarré l'application:

1. **Connexion Admin**:
   - Connectez-vous avec `admin@demo.com` / `demo123`
   - Explorez le dashboard admin
   - Consultez la liste des clients
   - Envoyez un message à un client

2. **Connexion Client**:
   - Ouvrez une fenêtre de navigation privée
   - Connectez-vous avec `client1@demo.com` / `demo123`
   - Consultez vos dossiers
   - Uploadez un document de test
   - Répondez au message de l'admin

3. **Tests de Sécurité**:
   - Vérifiez qu'un client ne voit que ses données
   - Testez les permissions d'upload
   - Changez les mots de passe

---

## 💡 Conseils

1. **Pour les tests**: Utilisez les comptes de seed (password: `demo123`)
2. **Pour la production**: Changez tous les mots de passe et le `NEXTAUTH_SECRET`
3. **Pour le développement**: Gardez Prisma Studio ouvert (`npm run db:studio`)
4. **Pour les logs**: Consultez la console du terminal

---

## 📞 Support

Pour toute question ou problème:
1. Consultez la documentation complète dans `/docs`
2. Vérifiez les erreurs dans la console du navigateur
3. Consultez les logs du serveur Next.js
4. Utilisez Prisma Studio pour inspecter la base de données

---

**Version**: 1.0.0  
**Dernière mise à jour**: Janvier 2026  
**Stack**: Next.js 16 + Prisma + TypeScript + Tailwind CSS
