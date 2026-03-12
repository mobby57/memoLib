# 🎬 GUIDE DE DÉMONSTRATION MEMOLIB

## 🚀 LANCEMENT RAPIDE

### Option 1: Démo Automatique (Recommandé)
```cmd
DEMO.bat
```

Choisissez:
1. **Demo RAPIDE** (2 min) - Clients + Dossiers
2. **Demo COMPLETE** (5 min) - Tout inclus
3. **Demo PERSONNALISEE** - Standard

### Option 2: Démo Manuelle
```powershell
# Rapide
.\DEMO-AUTO.ps1 -Quick

# Complète
.\DEMO-AUTO.ps1 -Full

# Standard
.\DEMO-AUTO.ps1
```

---

## 📊 CONTENU DES DÉMOS

### 🏃 DEMO RAPIDE (2 min)
- ✅ Création compte utilisateur
- ✅ 3 clients créés
- ✅ 3 dossiers créés
- ✅ Ouverture automatique du navigateur

**Temps**: 2 minutes  
**Commande**: `.\DEMO-AUTO.ps1 -Quick`

### 📦 DEMO STANDARD (3 min)
- ✅ Tout de la démo rapide
- ✅ Tags ajoutés aux dossiers
- ✅ Priorités définies
- ✅ Statuts changés (IN_PROGRESS)

**Temps**: 3 minutes  
**Commande**: `.\DEMO-AUTO.ps1`

### 🎯 DEMO COMPLETE (5 min)
- ✅ Tout de la démo standard
- ✅ Templates d'emails créés
- ✅ Configuration complète

**Temps**: 5 minutes  
**Commande**: `.\DEMO-AUTO.ps1 -Full`

---

## 🎭 SCÉNARIO DE DÉMONSTRATION

### 1. PRÉPARATION (30 secondes)
```cmd
# 1. Lancer l'API
START.bat

# 2. Attendre 10 secondes

# 3. Lancer la démo
DEMO.bat
```

### 2. DONNÉES CRÉÉES

#### Utilisateur Demo
- **Email**: demo[timestamp]@memolib.fr
- **Mot de passe**: Demo123456!
- **Nom**: Maître Dupont (Demo)

#### 3 Clients
1. **Jean Martin**
   - Email: jean.martin@example.com
   - Tél: 0601020304
   - Adresse: 15 rue de la Paix, 75002 Paris

2. **Marie Dubois**
   - Email: marie.dubois@example.com
   - Tél: 0612345678
   - Adresse: 28 avenue des Champs, 75008 Paris

3. **Pierre Durand**
   - Email: pierre.durand@example.com
   - Tél: 0623456789
   - Adresse: 42 boulevard Saint-Germain, 75006 Paris

#### 3 Dossiers
1. **Divorce amiable - Martin**
   - Client: Jean Martin
   - Tags: urgent, famille, divorce
   - Priorité: 5 (Très haute)
   - Statut: IN_PROGRESS

2. **Succession - Dubois**
   - Client: Marie Dubois
   - Tags: succession, famille
   - Priorité: 3 (Moyenne)
   - Statut: IN_PROGRESS

3. **Litige commercial - Durand**
   - Client: Pierre Durand
   - Statut: OPEN

#### 2 Templates Email (Demo complète)
1. **Accusé de réception**
2. **Demande de documents**

---

## 🎤 SCRIPT DE PRÉSENTATION

### Introduction (1 min)
> "Bonjour, je vais vous présenter MemoLib, un système complet de gestion d'emails pour cabinets d'avocats. J'ai préparé une démonstration avec des données réalistes."

### Connexion (30 sec)
1. Ouvrir http://localhost:5078/demo.html
2. Se connecter avec les identifiants affichés
3. Montrer le dashboard

### Dashboard (2 min)
> "Voici le dashboard principal. On voit immédiatement:"
- Nombre de dossiers (3)
- Nombre de clients (3)
- Statistiques en temps réel
- Dossiers récents

### Gestion Clients (2 min)
1. Cliquer sur "Clients"
2. Montrer la liste des 3 clients
3. Cliquer sur "Jean Martin"
4. Montrer la vue 360° client:
   - Coordonnées complètes
   - Historique des dossiers
   - Timeline des événements

### Gestion Dossiers (3 min)
1. Cliquer sur "Dossiers"
2. Montrer la liste avec filtres
3. Cliquer sur "Divorce amiable - Martin"
4. Montrer:
   - Informations du dossier
   - Tags (urgent, famille, divorce)
   - Priorité (5 - Très haute)
   - Statut (IN_PROGRESS)
   - Timeline complète

### Workflow (2 min)
1. Changer le statut d'un dossier
2. Ajouter des tags
3. Modifier la priorité
4. Montrer les notifications automatiques

### Recherche (1 min)
1. Utiliser la recherche
2. Filtrer par tags
3. Filtrer par statut
4. Montrer les résultats instantanés

### Templates Email (1 min) - Si démo complète
1. Aller dans "Templates"
2. Montrer les 2 templates créés
3. Expliquer la réutilisation

### Conclusion (1 min)
> "Comme vous pouvez le voir, MemoLib offre une solution complète pour gérer vos communications clients, vos dossiers, et automatiser votre workflow. Le système est opérationnel et prêt à l'emploi."

---

## 🎯 POINTS CLÉS À MONTRER

### ✅ Fonctionnalités Principales
1. **Dashboard intelligent** - Vue d'ensemble instantanée
2. **Gestion clients** - Vue 360° avec historique
3. **Gestion dossiers** - Workflow complet
4. **Tags et priorités** - Organisation flexible
5. **Recherche avancée** - Filtres multiples
6. **Timeline** - Historique complet
7. **Notifications** - Automatiques sur changements

### ✅ Avantages Métier
- ⚡ **Gain de temps** - Automatisation du workflow
- 📊 **Visibilité** - Dashboard en temps réel
- 🔍 **Traçabilité** - Historique complet
- 🎯 **Organisation** - Tags et priorités
- 🔔 **Réactivité** - Notifications automatiques

---

## 🔄 RÉINITIALISATION

Pour recommencer la démo:

```powershell
# 1. Supprimer la base de données
Remove-Item memolib.db

# 2. Recréer la base
dotnet ef database update

# 3. Relancer la démo
DEMO.bat
```

---

## 💡 CONSEILS DE PRÉSENTATION

### Avant la démo
- ✅ Vérifier que l'API est démarrée
- ✅ Lancer la démo automatique
- ✅ Préparer le navigateur
- ✅ Tester la connexion

### Pendant la démo
- 🎯 Rester focus sur les fonctionnalités clés
- 💬 Expliquer les bénéfices métier
- 👀 Montrer la simplicité d'utilisation
- ⚡ Être réactif aux questions

### Après la démo
- 📝 Récapituler les points clés
- 💰 Discuter du déploiement
- 📞 Proposer un essai gratuit
- 🤝 Planifier les prochaines étapes

---

## 📞 SUPPORT DÉMO

Si problème pendant la démo:

```powershell
# Vérifier l'API
Invoke-WebRequest http://localhost:5078/health

# Relancer l'API
.\RESTART.ps1

# Relancer la démo
DEMO.bat
```

---

## 🎉 RÉSULTAT ATTENDU

À la fin de la démo, le prospect doit:
- ✅ Comprendre les fonctionnalités principales
- ✅ Voir la valeur ajoutée pour son cabinet
- ✅ Être convaincu de la simplicité d'utilisation
- ✅ Vouloir tester le système
- ✅ Être prêt à discuter du déploiement

---

**Durée totale**: 10-15 minutes  
**Niveau**: Adapté à tous publics  
**Prérequis**: API démarrée  
**Résultat**: Démo professionnelle et convaincante
