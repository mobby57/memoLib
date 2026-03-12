# 📝 Changelog - MemoLib

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [2.0.0] - 2025-03-01

### ✨ Ajouté
- **Formulaires d'inscription intelligents** - Création de formulaires personnalisables par avocat
- **Espaces partagés multi-participants** - Collaboration entre CLIENT, LAWYER, JUDGE, SECRETARY, EXPERT
- **Gestion des documents par rôle** - Contrôle d'accès granulaire sur les documents
- **Journal d'activité complet** - Traçabilité de toutes les actions dans l'espace partagé
- **Design System unifié** - Variables CSS et composants réutilisables
- **CI/CD Pipeline** - GitHub Actions pour build et déploiement automatique
- **Standards de code** - .editorconfig et conventions de commit

### 🔄 Modifié
- Architecture harmonisée avec séparation claire des responsabilités
- Interface utilisateur modernisée avec design cohérent
- Documentation complète mise à jour

### 🐛 Corrigé
- Correction conflit `UpdateStatusRequest` dans controllers
- Fix `DateTime.UtcNow()` → `DateTime.UtcNow`

## [1.0.0] - 2025-02-27

### ✨ Ajouté
- Monitoring automatique Gmail (IMAP)
- Gestion complète des dossiers avec workflow
- Système de notifications temps réel (SignalR)
- Templates d'emails réutilisables
- Pièces jointes sécurisées
- Recherche intelligente (textuelle, embeddings, sémantique)
- Dashboard analytics
- Centre d'anomalies
- Authentification JWT avec RBAC
- 6 rôles utilisateurs (Owner, Admin, Manager, Agent, User, Client)
- Audit logging complet
- GDPR compliance

### 🔒 Sécurité
- Hashing BCrypt pour mots de passe
- Protection brute force
- Rate limiting
- Headers de sécurité (CSP, HSTS)
- Isolation multi-tenant

---

## Types de Changements

- `✨ Ajouté` - Nouvelles fonctionnalités
- `🔄 Modifié` - Changements dans fonctionnalités existantes
- `🗑️ Supprimé` - Fonctionnalités retirées
- `🐛 Corrigé` - Corrections de bugs
- `🔒 Sécurité` - Correctifs de sécurité
- `📚 Documentation` - Changements documentation
- `⚡ Performance` - Améliorations de performance
