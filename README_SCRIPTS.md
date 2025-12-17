# 🎯 SCRIPTS PARCOURS UTILISATEUR - README

## 🚀 Démarrage Rapide (30 secondes)

### Option 1 : Lanceur Simplifié (Recommandé)
```batch
Double-cliquer sur : PARCOURS_UTILISATEUR.bat
```

### Option 2 : Script Complet
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1
```

---

## 📦 Fichiers Disponibles

| Fichier | Type | Description | Utilisation |
|---------|------|-------------|-------------|
| **PARCOURS_UTILISATEUR.bat** | Batch | Menu interactif simple | Débutants |
| **PARCOURS_UTILISATEUR_EMAIL.ps1** | PowerShell | Script complet 6 étapes | Production |
| **TESTS_AVANCES_EMAIL.ps1** | PowerShell | 22 tests automatisés | Validation |
| **GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md** | Doc | Guide détaillé | Référence |
| **LIVRABLE_SCRIPTS_PARCOURS.md** | Doc | Vue d'ensemble | Présentation |
| **README_SCRIPTS.md** | Doc | Ce fichier | Navigation |

---

## 🎯 Que Faire en Fonction de Votre Besoin

### 🆕 Je découvre le système
```
👉 Lancer : PARCOURS_UTILISATEUR.bat
   Choisir : Option 1 (Mode interactif)
   
Vous serez guidé étape par étape !
```

### ⚡ Je veux tester rapidement
```
👉 Lancer : PARCOURS_UTILISATEUR.bat
   Choisir : Option 2 (Test automatique)
   
Test complet en 30 secondes !
```

### 🔍 Je veux valider le système
```
👉 Lancer : PARCOURS_UTILISATEUR.bat
   Choisir : Option 4 (Validation uniquement)
   
3 tests essentiels en 10 secondes !
```

### 🧪 Je veux des tests avancés
```powershell
👉 Lancer : .\TESTS_AVANCES_EMAIL.ps1 -FullTest

22 tests complets incluant :
- Tests de base (3)
- Tests de validation (9)
- Tests de performance (3)
- Tests de charge (1)
- Tests de sécurité (3)
- Tests d'intégration (3)
```

### 📚 Je veux comprendre comment ça marche
```
👉 Lire : GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md

Guide complet avec :
- Explication de chaque mode
- Exemples d'utilisation
- Personnalisation
- Dépannage
```

### 🎯 Je veux une vue d'ensemble
```
👉 Lire : LIVRABLE_SCRIPTS_PARCOURS.md

Document récapitulatif avec :
- Liste de tous les fichiers
- Fonctionnalités couvertes
- Cas d'usage
- Quick start
```

---

## 🔧 Prérequis

### ✅ Serveur Démarré
```batch
Terminal 1 : .\RUN_SERVER.bat
Terminal 2 : .\PARCOURS_UTILISATEUR.bat
```

### ✅ PowerShell Disponible
```powershell
# Vérifier la version (doit être >= 5.1)
$PSVersionTable.PSVersion
```

### ✅ Politique d'Exécution
```powershell
# Si erreur "scripts désactivés"
powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1"
```

---

## 📊 Vue d'Ensemble des Modes

### Mode 1 : Interactif 🗣️
- ✅ Guidé étape par étape
- ✅ Demande chaque information
- ✅ Parfait pour apprendre
- ⏱️ Durée : 3-5 minutes

**Exemple :**
```
Entrez le nom d'utilisateur desire: contact
Voulez-vous creer ce compte? (O/n): o
Provider (sendgrid/aws/microsoft/google): sendgrid
...
```

### Mode 2 : Automatique ⚡
- ✅ Exécution complète automatique
- ✅ Aucune interaction
- ✅ Parfait pour tests
- ⏱️ Durée : 30 secondes

**Commande :**
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "sendgrid"
```

### Mode 3 : Validation 🔍
- ✅ Tests essentiels uniquement
- ✅ Vérification rapide
- ✅ Parfait pour monitoring
- ⏱️ Durée : 10 secondes

**Résultat :**
```
[TEST 1/3] Health check... ✓ OK
[TEST 2/3] Check availability... ✓ OK
[TEST 3/3] List accounts... ✓ OK

RESULTAT: 3/3 tests reussis
```

### Mode 4 : Tests Avancés 🧪
- ✅ 22 tests complets
- ✅ Sécurité, performance, charge
- ✅ Parfait pour validation complète
- ⏱️ Durée : 2-3 minutes

**Commande :**
```powershell
.\TESTS_AVANCES_EMAIL.ps1 -FullTest
```

---

## 🎨 Exemples d'Utilisation

### Créer un compte "contact"
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "sendgrid"
```

### Créer un compte "support" avec AWS
```powershell
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "support" -Provider "aws"
```

### Tests de performance uniquement
```powershell
.\TESTS_AVANCES_EMAIL.ps1 -StressTest
```

### Tests de sécurité uniquement
```powershell
.\TESTS_AVANCES_EMAIL.ps1 -QuickTest
```

---

## 🐛 Problèmes Courants

### ❌ "Serveur non disponible"
**Solution :**
```batch
1. Ouvrir nouveau terminal
2. Exécuter : .\RUN_SERVER.bat
3. Attendre 5 secondes
4. Relancer le script
```

### ❌ "Scripts désactivés"
**Solution :**
```powershell
powershell -ExecutionPolicy Bypass -File "PARCOURS_UTILISATEUR_EMAIL.ps1"
```

### ❌ "Echec de la creation: API key"
**Solution :**
```
1. Créer fichier : .env.email
2. Ajouter : SENDGRID_API_KEY=votre_cle
3. Redémarrer serveur
```

### ❌ Caractères mal affichés
**Solution :**
```batch
chcp 65001
.\PARCOURS_UTILISATEUR.bat
```

---

## 📈 Résultats Attendus

### ✅ Succès Complet
```
╔═══════════════════════════════════════════════════════════════╗
║                     PARCOURS TERMINE                          ║
╚═══════════════════════════════════════════════════════════════╝

  SUCCES COMPLET!
  Le systeme de provisioning d'emails est pleinement operationnel.

  Prochaines etapes:
    1. Configurez vos cles API
    2. Integrez le composant React
    3. Configurez votre domaine personnalise
```

### ⚠️ Succès Partiel
```
  PARCOURS PARTIEL
  Certains tests ont echoue. Consultez les logs ci-dessus.
  
  → Normal si pas de configuration provider
  → Fonctionnalités de base opérationnelles
```

### ❌ Échec
```
  PROBLEME DETECTE
  Consultez DEMARRAGE_RAPIDE_EMAIL_CLOUD.md
  
  → Vérifier que le serveur est lancé
  → Consulter les logs serveur
```

---

## 🚀 Commandes Rapides

```powershell
# Parcours interactif complet
.\PARCOURS_UTILISATEUR.bat

# Test automatique rapide
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "contact" -Provider "sendgrid"

# Validation système
.\TESTS_AVANCES_EMAIL.ps1 -QuickTest

# Tests complets
.\TESTS_AVANCES_EMAIL.ps1 -FullTest

# Tests de charge
.\TESTS_AVANCES_EMAIL.ps1 -StressTest

# Avec username personnalisé
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "support" -Provider "aws"

# Mode verbose (debug)
.\PARCOURS_UTILISATEUR_EMAIL.ps1 -Username "test" -Verbose
```

---

## 📚 Documentation Complète

### Pour Utilisateurs
- **README_SCRIPTS.md** (ce fichier) - Navigation rapide
- **DEMARRAGE_RAPIDE_EMAIL_CLOUD.md** - Setup en 5 minutes

### Pour Développeurs
- **GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md** - Guide détaillé
- **RECAPITULATIF_EMAIL_CLOUD.md** - Architecture complète

### Pour Managers
- **LIVRABLE_SCRIPTS_PARCOURS.md** - Vue d'ensemble
- **GUIDE_PRODUCTION_COMPLET.md** - Section 8

---

## 🎯 Checklist Rapide

Avant de lancer les scripts :

- [ ] Serveur démarré (`RUN_SERVER.bat`)
- [ ] PowerShell 5.1+ installé
- [ ] Port 5000 disponible
- [ ] (Optionnel) Fichier `.env.email` créé

Pour tester :

- [ ] Lancé `PARCOURS_UTILISATEUR.bat`
- [ ] Choisi mode interactif (option 1)
- [ ] Suivi les instructions
- [ ] Vérifié le résultat final

Pour valider :

- [ ] Lancé `TESTS_AVANCES_EMAIL.ps1 -QuickTest`
- [ ] Vérifié 3/3 tests passés
- [ ] Consulté le rapport final

---

## 🎉 Vous Êtes Prêt !

**Lancez maintenant :**
```batch
.\PARCOURS_UTILISATEUR.bat
```

**Ou consultez :**
```
GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md
```

---

**Version :** 3.1  
**Date :** 17 Décembre 2025  
**Status :** ✅ Production Ready

💡 **Astuce :** Commencez par le mode interactif pour comprendre le système, puis utilisez le mode automatique pour les tests rapides !
