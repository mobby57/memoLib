# 🎯 Routes de Démonstration MemoLib

## 📋 Vue d'ensemble des interfaces

### 🔵 1. Super Admin (admin@memolib.fr / admin123)

**URL:** http://localhost:3000/super-admin/dashboard

**Fonctionnalités:**

- Gestion de tous les tenants/cabinets
- Vue globale des abonnements et revenus
- Statistiques MRR/ARR par plan
- Taux de croissance
- Administration système complète

---

### 🟢 2. Avocat/Lawyer (avocat@memolib.fr / admin123)

**URL:** http://localhost:3000/dashboard

**Fonctionnalités:**

- Tableau de bord principal avec statistiques
- Gestion des dossiers clients
- Calendrier des rendez-vous
- Documents et templates
- Factures et facturation
- Analytics et métriques
- Gestion des emails

**URLs spécifiques:**

- `/dashboard` - Vue principale
- `/dossiers` - Gestion des dossiers
- `/clients` - Liste des clients
- `/calendrier` - Calendrier
- `/factures` - Facturation
- `/documents` - Documents
- `/analytics` - Analytics

---

### 🟡 3. Client/Utilisateur

**URL:** http://localhost:3000/client-dashboard

**Fonctionnalités:**

- Vue simplifiée pour les clients
- Suivi de leurs dossiers
- Documents partagés
- Rendez-vous à venir
- Communications avec l'avocat
- Historique des factures

**URLs spécifiques:**

- `/client-dashboard` - Vue principale client
- `/client` - Alternative espace client

---

## 🔐 Identifiants de Connexion

### Admin

- Email: `admin@memolib.fr`
- Mot de passe: `<ADMIN_PASSWORD>`
- Accès: Super Admin

### Avocat

- Email: `avocat@memolib.fr`
- Mot de passe: `<DEMO_PASSWORD>`
- Accès: Lawyer/Avocat

---

## 🚀 Navigation Rapide

1. **Page de connexion:** http://localhost:3000/login
2. **Dashboard principal:** http://localhost:3000/dashboard
3. **Super Admin:** http://localhost:3000/super-admin/dashboard
4. **Client:** http://localhost:3000/client-dashboard

---

## ⚠️ Notes pour la Démo

- Les comptes sont préconfigurés dans la base de données
- Connexion via NextAuth avec credentials
- Rôles: SUPER_ADMIN, ADMIN, LAWYER, CLIENT
- Chaque rôle a des permissions et vues différentes
- Redirection automatique selon le rôle après connexion

---

## 📊 Fonctionnalités par Vue

### Super Admin

✅ Gestion multi-tenant
✅ Analytics financiers
✅ Monitoring des abonnements
✅ Administration globale

### Avocat

✅ Gestion de dossiers
✅ Calendrier intégré
✅ Facturation
✅ Templates de documents
✅ Email monitoring
✅ Analytics détaillés

### Client

✅ Suivi de dossier simplifié
✅ Accès documents
✅ Planning rendez-vous
✅ Historique communications
✅ Factures et paiements
