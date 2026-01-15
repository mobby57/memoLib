# 🗺️ Routes Disponibles - iaPostemanage

## 📊 Pages Principales

### Accueil & Auth
- `/` - Page d'accueil
- `/login` - Connexion
- `/register` - Inscription
- `/test-login` - Test de connexion

### Dashboard
- `/dashboard` - Dashboard principal (redirige selon rôle)

## 👨‍💼 Espace Admin

### Gestion
- `/admin` - Dashboard admin
- `/admin/clients` - Liste des clients
- `/admin/dossiers` - Gestion des dossiers
- `/admin/documents` - Documents
- `/admin/emails` - Emails
- `/admin/factures` - Facturation
- `/admin/settings` - Paramètres

### Analytics & Recherche
- `/admin/analytics/search` - **📊 Analytics de recherche** (NOUVEAU)
- `/search` - Page de recherche complète

### Formulaires & Workflows
- `/lawyer/forms` - Gestion des formulaires
- `/lawyer/forms/dashboard` - Dashboard formulaires
- `/lawyer/notifications` - Notifications avocat
- `/workflows` - Gestion des workflows

### IA & Assistant
- `/ai-assistant` - Assistant IA

## 🏢 Espace Super Admin

### Gestion Multi-tenant
- `/super-admin` - Dashboard super admin
- `/super-admin/tenants` - Gestion des tenants
- `/super-admin/users` - Gestion utilisateurs
- `/super-admin/plans` - Gestion des plans
- `/super-admin/support` - Support
- `/super-admin/settings` - Paramètres globaux

## 👤 Espace Client

### Dossiers & Documents
- `/client` - Dashboard client
- `/client/dossiers` - Mes dossiers
- `/client/dossiers/[id]` - Détail dossier
- `/client/documents` - Mes documents
- `/client/messages` - Messagerie

### Suivi & Paiements
- `/client/suivi` - Suivi de dossier
- `/client/paiements` - Mes paiements
- `/client/factures` - Mes factures

## 📝 Espaces de Travail CESEDA

- `/workspaces` - Liste des espaces
- `/workspaces/new` - Créer un espace
- `/workspaces/[id]` - Détail espace
- `/workspaces/[id]/documents` - Documents de l'espace

## 🔍 Système de Recherche (NOUVEAU)

### Composants Intégrés
- **Navigation** : Bouton de recherche avec Ctrl+K
- **AdminDashboard** : Widget QuickSearch
- **ClientDashboard** : Widget QuickSearch

### Pages
- `/search` - Recherche avancée avec filtres
- `/admin/analytics/search` - Analytics de recherche (Admin/SuperAdmin)

### API Endpoints
- `GET /api/search?q=term&types=client,dossier&limit=10`
- `GET /api/search/suggestions?q=term`
- `GET /api/search/analytics?type=stats`
- `GET /api/search/analytics?type=popular&limit=10`
- `GET /api/search/analytics?type=recent&limit=10`
- `GET /api/search/analytics?type=empty&limit=20`
- `GET /api/search/analytics?type=trends&days=7`

## 📁 Autres Pages

- `/templates` - Templates de documents
- `/factures` - Facturation
- `/dossiers` - Dossiers

## 🚀 Raccourcis Clavier

- **Ctrl + K** : Ouvrir la recherche globale (partout dans l'app)

## 🔐 Protection des Routes

### Routes Publiques
- `/`, `/login`, `/register`

### Routes Authentifiées
- Toutes les autres routes nécessitent une session active

### Routes Admin
- `/admin/*` - Rôle ADMIN ou SUPER_ADMIN requis
- `/super-admin/*` - Rôle SUPER_ADMIN uniquement

## ⚡ Fonctionnalités Récentes

### Phase 5 - Recherche Intelligente ✅
- Moteur de recherche multi-entités (clients, dossiers, documents, emails)
- Scoring intelligent (exact, début, contenu, fuzzy)
- Analytics complet avec tracking
- Intégration UI dans navigation et dashboards
- Raccourci Ctrl+K global

### Phase 4 - IA Locale Ollama ✅
- Analyse automatique des emails CESEDA
- Extraction des informations clients
- Détection du type de demande
- Génération de réponses automatiques
- 100% local et gratuit
