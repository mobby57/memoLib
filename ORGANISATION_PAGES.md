# Organisation des Pages - SecureVault v2.2

## 📁 Structure Mise à Jour

### Pages Principales

#### 1. **Navigation** (`/` ou `/nav`)
- **Fichier**: `templates/navigation.html`
- **Description**: Centre de commande principal avec grille de cartes
- **Fonctionnalités**:
  - Accès rapide à toutes les fonctionnalités
  - Design moderne avec animations
  - Mode sombre/clair
  - Actions rapides

#### 2. **Configuration** (`/setup`)
- **Fichier**: `templates/index.html`
- **Description**: Configuration initiale Gmail/OpenAI
- **Onglets**:
  - Gmail (App Password)
  - OpenAI (API Key)
  - Destinataires
  - Assistant Vocal
  - Mes Demandes
  - Workflow
  - Paramètres
  - Accessibilité

#### 3. **Composer IA** (`/composer`)
- **Fichier**: `templates/smart_composer.html`
- **Description**: Génération intelligente d'emails
- **Fonctionnalités**:
  - Analyse de documents (PDF, DOCX, images)
  - Transcription audio
  - Génération IA contextuelle
  - Prévisualisation et envoi

#### 4. **Envoi Simple** (`/send`)
- **Fichier**: `templates/send.html`
- **Description**: Envoi rapide d'emails
- **Fonctionnalités**:
  - Formulaire simple
  - Validation en temps réel
  - Historique récent

#### 5. **Historique** (`/history`)
- **Fichier**: `templates/history.html`
- **Description**: Historique des emails envoyés
- **Fonctionnalités**:
  - Liste complète des envois
  - Filtres et recherche
  - Statistiques

#### 6. **Templates** (`/templates`)
- **Fichier**: `templates/templates.html`
- **Description**: Gestion des modèles d'emails
- **Fonctionnalités**:
  - Créer/modifier/supprimer templates
  - Catégories
  - Prévisualisation

#### 7. **Agent Vocal** (`/agent`)
- **Fichier**: `templates/voice_agent.html`
- **Description**: Interface vocale IA
- **Fonctionnalités**:
  - Synthèse vocale (TTS)
  - Reconnaissance vocale (STT)
  - Commandes vocales

#### 8. **Automatisation** (`/automation`)
- **Fichier**: `templates/automation.html`
- **Description**: Emails programmés et campagnes
- **Fonctionnalités**:
  - Planification d'envois
  - Campagnes en masse
  - Suivi automatique

#### 9. **Sécurité** (`/security`)
- **Fichier**: `templates/security.html`
- **Description**: Audit et protection
- **Fonctionnalités**:
  - Logs d'audit
  - 2FA
  - Rotation des clés

#### 10. **Administration** (`/admin`)
- **Fichier**: `templates/admin.html`
- **Description**: Gestion système
- **Fonctionnalités**:
  - Gestion utilisateurs
  - Analytics avancées
  - Configuration système

## 🎨 Design System

### Navigation Principale
- **Barre de navigation sticky** avec logo et liens
- **Gradient violet** (#667eea → #764ba2)
- **Toggle thème** (clair/sombre)
- **Liens actifs** mis en évidence

### Cartes de Navigation
- **Grille responsive** (3 colonnes desktop, 1 mobile)
- **Animations au hover** (élévation + ombre)
- **Icônes emoji** pour identification rapide
- **Barre de progression** au survol

### Thème
- **Clair**: Fond blanc, texte sombre
- **Sombre**: Fond #2d2d2d, texte clair
- **Persistance**: localStorage

## 🔗 Routes API

### Emails
- `POST /api/send-email` - Envoyer email
- `GET /api/email-history` - Historique
- `POST /api/schedule-email` - Programmer

### IA
- `POST /api/generate-email` - Génération simple
- `POST /api/generate-smart-email` - Génération avancée
- `POST /api/generate-content` - Contenu personnalisé

### Configuration
- `POST /api/save-gmail` - Sauvegarder Gmail
- `POST /api/save-openai` - Sauvegarder OpenAI
- `POST /api/verify-password` - Vérifier mot de passe
- `GET /api/check-credentials` - Vérifier config

### Templates
- `GET /api/templates` - Liste templates
- `POST /api/templates` - Créer template
- `DELETE /api/templates/<id>` - Supprimer

### Admin
- `GET /api/admin/users` - Liste utilisateurs
- `GET /api/admin/analytics` - Statistiques

## 📱 Responsive

### Desktop (>1024px)
- Navigation horizontale complète
- Grille 3 colonnes
- Sidebar visible

### Tablet (768px-1024px)
- Navigation compacte
- Grille 2 colonnes
- Sidebar collapsible

### Mobile (<768px)
- Navigation verticale
- Grille 1 colonne
- Menu hamburger

## 🚀 Améliorations Appliquées

1. ✅ Navigation unifiée avec barre sticky
2. ✅ Design moderne avec gradients
3. ✅ Animations fluides
4. ✅ Mode sombre complet
5. ✅ Grille de cartes responsive
6. ✅ Icônes cohérentes
7. ✅ Raccourcis clavier (Ctrl+N, Ctrl+K)
8. ✅ Notifications toast
9. ✅ Transitions au scroll
10. ✅ CSS modulaire (navigation.css)

## 📝 Fichiers Créés/Modifiés

### Nouveaux
- `templates/base.html` - Template de base
- `static/css/navigation.css` - Styles navigation
- `static/js/navigation.js` - Scripts navigation
- `ORGANISATION_PAGES.md` - Cette documentation

### Modifiés
- `templates/navigation.html` - Design moderne
- `src/web/app.py` - Route / vers navigation
- Endpoint `/api/verify-password` ajouté

## 🔧 Configuration

### Variables d'environnement
```bash
SECRET_KEY=votre_cle_secrete
SESSION_TIMEOUT=3600
```

### Démarrage
```bash
python src\web\app.py
```

### URL
http://127.0.0.1:5000

## 📊 Prochaines Étapes

1. Implémenter recherche globale (Ctrl+K)
2. Ajouter notifications push
3. Créer dashboard analytics
4. Améliorer accessibilité (ARIA)
5. Tests E2E avec Playwright
