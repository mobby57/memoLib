# 🚀 IAPosteManager React - Interface Moderne

Interface React moderne et responsive pour IAPosteManager v2.3

## ✨ Fonctionnalités

- 🎨 **Design moderne** avec Tailwind CSS
- ⚡ **Performance optimale** avec Vite
- 🔄 **Routing** avec React Router
- 📱 **Responsive** - fonctionne sur mobile, tablette et desktop
- 🎭 **Animations** fluides avec Framer Motion
- 🔔 **Notifications** avec React Hot Toast
- 🎯 **State management** avec Zustand
- 🔐 **Authentification** sécurisée
- ✉️ **Envoi d'emails** avec validation
- 🤖 **Génération IA** avec OpenAI
- 📊 **Dashboard** avec statistiques
- 📜 **Historique** des emails envoyés
- ⚙️ **Configuration** Gmail et OpenAI

## 📦 Installation

```bash
# Installer les dépendances
npm install

# ou avec yarn
yarn install
```

## 🚀 Démarrage

### Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### Production

```bash
# Build
npm run build

# Prévisualiser le build
npm run preview
```

## 🔧 Configuration

### Backend API

Le frontend se connecte au backend Flask sur `http://localhost:5000`

Assurez-vous que le backend est démarré:

```bash
# Dans le dossier racine
python src/web/app.py
```

### Variables d'environnement

Créez un fichier `.env` (optionnel):

```env
VITE_API_URL=http://localhost:5000
```

## 📁 Structure du projet

```
frontend-react/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Header.jsx
│   ├── pages/           # Pages de l'application
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SendEmail.jsx
│   │   ├── Configuration.jsx
│   │   ├── History.jsx
│   │   ├── Templates.jsx
│   │   └── AIGenerate.jsx
│   ├── services/        # Services API
│   │   └── api.js
│   ├── store/           # State management (Zustand)
│   │   └── index.js
│   ├── App.jsx          # Composant racine
│   ├── main.jsx         # Point d'entrée
│   └── index.css        # Styles globaux
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Technologies utilisées

- **React 18** - Framework UI
- **Vite** - Build tool ultra-rapide
- **React Router** - Routing
- **Tailwind CSS** - Framework CSS utility-first
- **Axios** - HTTP client
- **Zustand** - State management léger
- **Framer Motion** - Animations
- **React Hot Toast** - Notifications
- **Lucide React** - Icônes
- **date-fns** - Manipulation de dates

## 🌟 Fonctionnalités avancées

### Authentification
- Login avec mot de passe maître
- Session persistante
- Déconnexion sécurisée

### Envoi d'emails
- Formulaire avec validation
- Barre de progression
- Gestion des erreurs
- Modal de mot de passe si session expirée

### Génération IA
- 4 tons différents (Professionnel, Amical, Formel, Décontracté)
- Génération de l'objet et du corps
- Copie dans le presse-papier
- Utilisation directe dans l'envoi

### Dashboard
- Statistiques en temps réel
- Actions rapides
- Activité récente
- Design moderne avec animations

### Configuration
- Configuration Gmail sécurisée
- Configuration OpenAI
- Chiffrement des credentials
- Instructions intégrées

## 🔐 Sécurité

- Credentials chiffrés avec Fernet (AES-256)
- PBKDF2HMAC avec 100,000 itérations
- Stockage local sécurisé
- Aucune donnée envoyée vers des serveurs externes
- Session sécurisée avec mot de passe maître

## 📱 Responsive Design

L'interface s'adapte automatiquement à tous les écrans:
- 📱 Mobile (< 768px)
- 📱 Tablette (768px - 1024px)
- 🖥️ Desktop (> 1024px)

## 🎯 Roadmap

- [ ] Templates d'emails personnalisables
- [ ] Envoi programmé
- [ ] Envoi en masse
- [ ] Statistiques avancées
- [ ] Mode sombre
- [ ] Export des données
- [ ] Gestion des pièces jointes

## 🤝 Contribution

Les contributions sont les bienvenues! N'hésitez pas à ouvrir une issue ou une PR.

## 📄 Licence

© 2025 IAPosteManager - Tous droits réservés

## 💬 Support

Pour toute question ou problème:
- 📧 Créez une issue sur GitHub
- 📖 Consultez la documentation
- 💡 Vérifiez les logs du backend

---

**Version**: 2.3.0  
**Build avec**: ⚡ Vite + ⚛️ React + 🎨 Tailwind CSS
