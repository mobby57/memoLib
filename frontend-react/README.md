# IAPosteManager Frontend React

Interface utilisateur moderne pour IAPosteManager construite avec React, Vite et Tailwind CSS.

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build Production
```bash
npm run build
```

## 📁 Structure

```
src/
├── components/          # Composants réutilisables
├── pages/              # Pages principales
├── contexts/           # Contexts React (Auth, etc.)
├── services/           # Services API
├── hooks/              # Hooks personnalisés
└── utils/              # Utilitaires
```

## 🎯 Fonctionnalités

- ✅ Dashboard avec statistiques
- ✅ Compositeur d'emails avec IA
- ✅ Agent vocal interactif
- ✅ Configuration complète
- ✅ Interface responsive
- ✅ Authentification
- ✅ Notifications toast

## 🛠️ Technologies

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icônes
- **React Hot Toast** - Notifications

## 🔧 Configuration

1. Copier `.env.example` vers `.env`
2. Configurer l'URL de l'API backend
3. Démarrer le serveur de développement

## 📡 API

Le frontend communique avec le backend Flask via l'API REST sur `/api/*`.

Endpoints principaux :
- `/api/email/*` - Gestion emails
- `/api/ai/*` - Services IA
- `/api/voice/*` - Services vocaux
- `/api/auth/*` - Authentification
- `/api/config/*` - Configuration

## 🎨 Design System

Classes Tailwind personnalisées :
- `.btn-primary` - Bouton principal
- `.btn-secondary` - Bouton secondaire
- `.input-field` - Champ de saisie
- `.card` - Carte de contenu