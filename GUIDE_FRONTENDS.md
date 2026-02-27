# 🚀 GUIDE FRONTENDS - MemoLib Platform

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────┐
│         MemoLib Platform                │
├─────────────────────────────────────────┤
│                                         │
│  Port 3000: Frontend Utilisateur       │
│  └─ Landing page multi-secteurs        │
│  └─ Inscription clients                │
│  └─ Application métier                 │
│                                         │
│  Port 8091: Admin Panel                │
│  └─ Dashboard monitoring                │
│  └─ Gestion secteurs                   │
│  └─ Gestion utilisateurs               │
│  └─ Maintenance base de données        │
│                                         │
│  Port 5078: API Backend                │
│  └─ ASP.NET Core 9.0                   │
│  └─ Endpoints REST                     │
│  └─ Multi-tenant                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🚀 LANCEMENT RAPIDE

### Option 1 : Script Automatique (Recommandé)

```powershell
.\start-all.ps1
```

**Ce script lance automatiquement :**
1. ✅ API Backend (port 5078)
2. ✅ Frontend Utilisateur (port 3000)
3. ✅ Admin Panel (port 8091)

---

### Option 2 : Lancement Manuel

**Terminal 1 - API Backend :**
```powershell
dotnet run
```

**Terminal 2 - Frontend Utilisateur :**
```powershell
node server-frontend.js
```

**Terminal 3 - Admin Panel :**
```powershell
node server-admin.js
```

---

## 🌐 ACCÈS

### Frontend Utilisateur (Port 3000)
```
http://localhost:3000
```

**Fonctionnalités :**
- ✅ Landing page multi-secteurs
- ✅ Sélection secteur (Legal, Medical, Consulting, etc.)
- ✅ Formulaire inscription
- ✅ Essai gratuit 30 jours
- ✅ Responsive design

**Utilisateurs cibles :**
- Avocats → LegalMemo
- Médecins → MediMemo
- Consultants → ConsultMemo
- Comptables → AccountMemo
- Architectes → ArchMemo
- Agents immobiliers → RealtyMemo
- Assureurs → InsureMemo
- Ingénieurs → EngineerMemo

---

### Admin Panel (Port 8091)
```
http://localhost:8091
```

**Fonctionnalités :**
- ✅ Dashboard temps réel
- ✅ Statistiques (utilisateurs, revenus, emails)
- ✅ Gestion secteurs
- ✅ Gestion utilisateurs
- ✅ Maintenance base de données
- ✅ Logs système
- ✅ Configuration

**Utilisateurs cibles :**
- Administrateurs système
- Équipe technique
- Support client

---

## 📁 STRUCTURE FICHIERS

```
MemoLib.Api/
├── frontend/
│   └── index.html          # Landing page (port 3000)
├── admin/
│   └── index.html          # Admin panel (port 8091)
├── server-frontend.js      # Serveur Node.js port 3000
├── server-admin.js         # Serveur Node.js port 8091
└── start-all.ps1           # Script lancement automatique
```

---

## 🎨 PERSONNALISATION PAR SECTEUR

### Frontend Utilisateur

Chaque secteur a :
- **Icône unique** : ⚖️ 👨‍⚕️ 💼 📊 🏗️ 🏠 💰 🔧
- **Nom de marque** : LegalMemo, MediMemo, etc.
- **Prix adapté** : 20-35€/mois selon secteur
- **Description ciblée** : Adapté au métier

### Exemple Legal (Avocats)
```javascript
{
  id: 'legal',
  name: 'LegalMemo',
  icon: '⚖️',
  description: 'Pour avocats et juristes',
  price: 30,
  features: ['Gestion dossiers', 'Conformité RGPD', 'Templates juridiques']
}
```

### Exemple Medical (Médecins)
```javascript
{
  id: 'medical',
  name: 'MediMemo',
  icon: '⚕️',
  description: 'Pour médecins et professionnels santé',
  price: 25,
  features: ['Dossiers patients', 'Conformité HIPAA', 'Ordonnances']
}
```

---

## 🔧 CONFIGURATION

### Frontend (port 3000)

**Modifier l'URL de l'API :**
```javascript
// Dans frontend/index.html
const API_URL = 'http://localhost:5078';
```

**Ajouter un nouveau secteur :**
```javascript
const sectors = [
    // ... secteurs existants
    { 
        id: 'nouveau', 
        name: 'NouveauMemo', 
        icon: '🎯', 
        price: 30 
    }
];
```

### Admin (port 8091)

**Modifier l'URL de l'API :**
```javascript
// Dans admin/index.html
const API_URL = 'http://localhost:5078';
```

---

## 📊 FONCTIONNALITÉS DÉTAILLÉES

### Frontend Utilisateur

**1. Landing Page**
- Hero section avec CTA
- Grille des 8 secteurs
- Modal inscription
- Design responsive

**2. Sélection Secteur**
- Clic sur carte secteur
- Affichage modal inscription
- Formulaire adapté au secteur

**3. Inscription**
- Nom complet
- Email professionnel
- Téléphone
- Nom cabinet/entreprise
- Essai gratuit 30 jours

**4. Intégration API**
- Appel `/api/sector/available`
- Appel `/api/auth/register`
- Gestion erreurs

---

### Admin Panel

**1. Dashboard**
- Utilisateurs total
- Secteurs actifs
- Emails traités
- Revenus MRR
- Rafraîchissement auto (30s)

**2. Gestion Secteurs**
- Liste des 8 secteurs
- Utilisateurs par secteur
- Revenus par secteur
- Status actif/inactif

**3. Gestion Utilisateurs**
- Liste complète
- Recherche
- Filtres par secteur
- Actions (voir, éditer, supprimer)

**4. Base de Données**
- Backup
- Optimisation
- Reset (avec confirmation)
- Informations (taille, tables, etc.)

**5. Logs Système**
- Affichage temps réel
- Filtres
- Export
- Effacement

**6. Configuration**
- Test connexion API
- Status services
- Paramètres système

---

## 🧪 TESTS

### Tester Frontend (port 3000)

1. Ouvrir http://localhost:3000
2. Vérifier affichage 8 secteurs
3. Cliquer sur un secteur
4. Remplir formulaire inscription
5. Vérifier appel API

### Tester Admin (port 8091)

1. Ouvrir http://localhost:8091
2. Vérifier dashboard
3. Tester navigation menu
4. Vérifier connexion API
5. Tester fonctions maintenance

---

## 🚀 DÉPLOIEMENT PRODUCTION

### Frontend Utilisateur

**Option 1 : Vercel/Netlify**
```bash
# Déployer frontend/ sur Vercel
vercel deploy frontend/
```

**Option 2 : Serveur Node.js**
```bash
# Lancer en production
NODE_ENV=production node server-frontend.js
```

### Admin Panel

**Recommandation : Accès restreint**
```bash
# Ajouter authentification
# Limiter accès IP
# HTTPS obligatoire
```

---

## 📈 MÉTRIQUES

### Frontend (port 3000)

**Objectifs :**
- Taux conversion : 10%
- Temps chargement : < 2s
- Mobile-friendly : 100%

**Tracking :**
- Google Analytics
- Hotjar (heatmaps)
- Mixpanel (événements)

### Admin (port 8091)

**Métriques :**
- Utilisateurs actifs
- Revenus MRR
- Churn rate
- Support tickets

---

## 🔐 SÉCURITÉ

### Frontend
- ✅ HTTPS en production
- ✅ Validation formulaires
- ✅ Protection CSRF
- ✅ Rate limiting

### Admin
- ✅ Authentification obligatoire
- ✅ Accès IP restreint
- ✅ Logs d'audit
- ✅ 2FA recommandé

---

## 💡 PROCHAINES ÉTAPES

### Court Terme
1. ✅ Lancer les 3 services
2. ⏳ Tester inscription
3. ⏳ Personnaliser design
4. ⏳ Ajouter analytics

### Moyen Terme
1. Application métier complète
2. Dashboard utilisateur
3. Gestion dossiers
4. Templates emails

### Long Terme
1. Application mobile
2. Intégrations tierces
3. IA avancée
4. Marketplace

---

## 🎯 COMMANDES UTILES

```powershell
# Lancer tout
.\start-all.ps1

# Lancer API seule
dotnet run

# Lancer frontend seul
node server-frontend.js

# Lancer admin seul
node server-admin.js

# Arrêter tout
# Ctrl+C dans chaque terminal
```

---

## 📞 SUPPORT

**Problèmes courants :**

**Port déjà utilisé :**
```powershell
# Trouver processus
netstat -ano | findstr :3000
# Tuer processus
taskkill /PID <PID> /F
```

**Node.js non installé :**
```powershell
# Télécharger : https://nodejs.org
```

**API non accessible :**
```powershell
# Vérifier API lancée
curl http://localhost:5078/health
```

---

## ✅ CHECKLIST LANCEMENT

- [ ] API Backend lancée (port 5078)
- [ ] Frontend lancé (port 3000)
- [ ] Admin lancé (port 8091)
- [ ] Test inscription frontend
- [ ] Test dashboard admin
- [ ] Connexion API OK
- [ ] Secteurs chargés
- [ ] Design responsive OK

---

**VOUS ÊTES PRÊT ! 🚀**

**Lancez :**
```powershell
.\start-all.ps1
```

**Puis ouvrez :**
- http://localhost:3000 (Utilisateurs)
- http://localhost:8091 (Admin)
